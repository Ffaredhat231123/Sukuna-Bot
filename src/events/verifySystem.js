const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { getRobloxUser } = require('../utils/robloxApi');
const { evaluateAccountAge } = require('../utils/verificationLogic');

// IDs de Roles (Reemplaza con los tuyos o usa variables de entorno)
const ROLES = {
    VERIFIED: 'ID_ROL_VERIFICADO',
    PENDING: 'ID_ROL_PENDIENTE'
};

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // 1. Mostrar Modal al hacer clic en el botón
        if (interaction.isButton() && interaction.customId === 'start_verify') {
            const modal = new ModalBuilder()
                .setCustomId('modal_verify')
                .setTitle('Verificación de Roblox');

            const usernameInput = new TextInputBuilder()
                .setCustomId('roblox_username')
                .setLabel('¿Cuál es tu nombre de usuario en Roblox?')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ej: Builderman')
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(usernameInput));
            return await interaction.showModal(modal);
        }

        // 2. Procesar el Modal
        if (interaction.isModalSubmit() && interaction.customId === 'modal_verify') {
            await interaction.deferReply({ ephemeral: true });

            const username = interaction.fields.getTextInputValue('roblox_username');
            const robloxData = await getRobloxUser(username);

            if (!robloxData) {
                return interaction.editReply({ content: '❌ No se encontró el usuario en Roblox. Verifica el nombre.' });
            }

            const status = evaluateAccountAge(robloxData.createdAt);
            const member = interaction.member;

            // Crear Ticket (Canal Privado)
            const ticketChannel = await interaction.guild.channels.create({
                name: `verify-${username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                ],
            });

            const resultEmbed = new EmbedBuilder()
                .setAuthor({ name: `Resultado para ${robloxData.username}` })
                .addFields(
                    { name: 'Fecha de Creación', value: `<t:${Math.floor(robloxData.createdAt.getTime() / 1000)}:R>`, inline: true },
                    { name: 'Estado', value: status, inline: true }
                );

            if (status === 'VERIFIED') {
                await member.roles.add(ROLES.VERIFIED);
                resultEmbed.setColor('Green').setDescription('✅ Has sido verificado automáticamente.');
            } else if (status === 'PENDING') {
                await member.roles.add(ROLES.PENDING);
                resultEmbed.setColor('Red').setDescription('❌ Tu cuenta es demasiado nueva. Se te ha asignado el rol Pendiente.');
            } else {
                resultEmbed.setColor('Yellow').setDescription('⚠️ Tu cuenta requiere revisión manual por el staff.');
            }

            await ticketChannel.send({ content: `${member}, tu proceso ha finalizado.`, embeds: [resultEmbed] });
            await interaction.editReply({ content: `Proceso iniciado en ${ticketChannel}` });
        }
    }
};
