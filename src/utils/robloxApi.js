const axios = require('axios');

async function getRobloxUser(username) {
    try {
        // Obtener ID del usuario por nombre
        const userRes = await axios.post('https://users.roblox.com/v1/usernames/users', {
            usernames: [username],
            excludeBannedUsers: true
        });

        if (!userRes.data.data.length) return null;

        const userId = userRes.data.data[0].id;

        // Obtener detalles del usuario (fecha de creación)
        const detailRes = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
        
        return {
            id: userId,
            username: detailRes.data.name,
            createdAt: new Date(detailRes.data.created)
        };
    } catch (error) {
        console.error('Error fetching Roblox data:', error);
        return null;
    }
}

module.exports = { getRobloxUser };
