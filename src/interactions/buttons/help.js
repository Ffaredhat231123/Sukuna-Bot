File: commands/utility/help.js
const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder, 
    ComponentType, 
    ApplicationCommandOptionType 
} = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Displays all available commands via a clean GUI.',
    category: 'utility',
    options: [
        {
            name: 'command',
            description: 'Get detailed info on a specific command',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
    async execute(message, args, client, isSlash) {
        const cmdName = isSlash ? message.options.getString('command') : args[0];

        // 1. Handle specific command search
        if (cmdName) {
            const command = client.commands.get(cmdName.toLowerCase());
            if (!command) return message.reply({ content: `❌ Command \`${cmdName}\` not found.`, ephemeral: true });

            const detailEmbed = new EmbedBuilder()
                .setTitle(`Command: ${command.name}`)
                .setColor('#5865F2')
                .addFields(
                    { name: 'Description', value: command.description || 'No description' },
                    { name: 'Category', value: `\`${command.category}\``, inline: true },
                    { name: 'Permissions', value: `\`${command.permissions || 'None'}\``, inline: true }
                )
                .setFooter({ text: 'Prefix: ! | Supporting Slash Commands' });

            return message.reply({ embeds: [detailEmbed] });
        }

        // 2. Main Help Menu Logic
        const categories = [...new Set(client.commands.map(cmd => cmd.category))];
        
        const mainEmbed = new EmbedBuilder()
            .setTitle('⛩️ Sukuna Bot | Help Menu')
            .setColor('#2B2D31') // Stealth Dark Theme
            .setDescription(
                'Welcome to the Sukuna Help Interface.\n' +
                'Select a category from the dropdown menu below to view commands.'
            )
            .addFields(
                { name: 'Statistics', value: `Commands: \`${client.commands.size}\` | Categories: \`${categories.length}\``, inline: true },
                { name: 'Prefix', value: '`!` or `/`', inline: true }
            )
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: 'Developed by Senior DJS Team', iconURL: client.user.displayAvatarURL() });

        // Create the Select Menu
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_category_select')
            .setPlaceholder('Choose a command category...')
            .addOptions(
                categories.map(cat => 
                    new StringSelectMenuOptionBuilder()
                        .setLabel(cat.charAt(0).toUpperCase() + cat.slice(1))
                        .setValue(cat)
                        .setEmoji(getEmoji(cat))
                )
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const response = await message.reply({
            embeds: [mainEmbed],
            components: [row]
        });

        // 3. Collector to handle category switching
        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 60000 // 1 minute active time
        });

        collector.on('collect', async (interaction) => {
            if (isSlash ? interaction.user.id !== message.user.id : interaction.user.id !== message.author.id) {
                return interaction.reply({ content: 'Use the help command yourself to navigate!', ephemeral: true });
            }

            const selectedCategory = interaction.values[0];
            const categoryCommands = client.commands.filter(cmd => cmd.category === selectedCategory);

            const categoryEmbed = new EmbedBuilder()
                .setTitle(`${getEmoji(selectedCategory)} ${selectedCategory.toUpperCase()} Commands`)
                .setColor('#5865F2')
                .setDescription(
                    categoryCommands.map(cmd => `**\`!${cmd.name}\`**\n${cmd.description}`).join('\n\n')
                )
                .setFooter({ text: `Total commands in ${selectedCategory}: ${categoryCommands.size}` });

            await interaction.update({ embeds: [categoryEmbed] });
        });

        collector.on('end', () => {
            const disabledRow = new ActionRowBuilder().addComponents(
                selectMenu.setDisabled(true).setPlaceholder('Help session expired.')
            );
            response.edit({ components: [disabledRow] }).catch(() => null);
        });
    },
};

// Helper function for visual flair
function getEmoji(category) {
    const emojis = {
        moderation: '🛡️',
        fun: '🎮',
        utility: '🛠️',
        competitive: '🏆',
        raids: '⚔️',
        roblox: '🧱',
        tickets: '🎫'
    };
    return emojis[category.toLowerCase()] || '📂';
}
