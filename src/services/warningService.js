File: commands/moderation/warn.js
const { EmbedBuilder, ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');
const db = require('../../db.js');
const { v4: uuidv4 } = require('uuid');

module.exports = {
    name: 'warn',
    description: 'Issues a formal warning to a member.',
    category: 'moderation',
    permissions: [PermissionFlagsBits.ModerateMembers],
    options: [
        {
            name: 'target',
            description: 'The user to warn',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'reason',
            description: 'Reason for the infraction',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
    async execute(message, args, client, isSlash) {
        // Uniform data extraction
        const user = isSlash ? message.options.getUser('target') : message.mentions.users.first();
        const member = message.guild.members.cache.get(user?.id);
        const moderator = isSlash ? message.user : message.author;
        const reason = (isSlash ? message.options.getString('reason') : args.slice(1).join(' ')) || 'No reason specified.';

        // Validation 
        if (!user) return message.reply('❌ You must mention a valid user.');
        if (user.id === moderator.id) return message.reply('❌ You cannot warn yourself.');
        if (user.id === client.user.id) return message.reply('❌ I cannot warn myself.');
        
        // Hierarchy Check
        if (member && member.roles.highest.position >= message.member.roles.highest.position && message.guild.ownerId !== moderator.id) {
            return message.reply('❌ You cannot warn someone with an equal or higher role.');
        }

        const warnId = uuidv4().split('-')[0].toUpperCase();

        try {
            const insert = db.prepare('INSERT INTO warnings (guild_id, user_id, warn_id, reason, moderator_id) VALUES (?, ?, ?, ?, ?)');
            insert.run(message.guild.id, user.id, warnId, reason, moderator.id);

            const successEmbed = new EmbedBuilder()
                .setAuthor({ name: `Infraction Issued`, iconURL: user.displayAvatarURL() })
                .setColor('#ED4245') // Darker red for serious tone
                .setDescription(`**Target:** ${user.tag} (${user.id})\n**Reason:** ${reason}`)
                .addFields(
                    { name: 'Case ID', value: `\`#${warnId}\``, inline: true },
                    { name: 'Moderator', value: `${moderator.tag}`, inline: true }
                )
                .setFooter({ text: 'Sukuna Bot | Persistence Active' })
                .setTimestamp();

            // DM Notification
            const dmEmbed = new EmbedBuilder()
                .setTitle(`Warning received in ${message.guild.name}`)
                .setColor('#ED4245')
                .setDescription(`Reason: ${reason}\nCase ID: \`${warnId}\``)
                .setTimestamp();

            await user.send({ embeds: [dmEmbed] }).catch(() => null); // Silently fail if DMs off

            return message.reply({ embeds: [successEmbed] });

        } catch (error) {
            console.error(error);
            return message.reply('❌ Database error occurred while processing the warning.');
        }
    },
};
