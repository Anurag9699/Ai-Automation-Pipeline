const fs = require('fs');

async function main() {
    try {
        const fetch = (await import('node-fetch')).default;
        
        const resStats = await fetch('http://localhost:4000/api/stats');
        console.log('Stats status:', resStats.status);
        const statsData = await resStats.json();
        console.log('Stats length:', Object.keys(statsData).length);

        const resContent = await fetch('http://localhost:4000/api/content');
        console.log('Content status:', resContent.status);
        const contentData = await resContent.json();
        console.log('Items:', contentData.length);
        
        console.log('Success, no errors thrown.');
    } catch(e) {
        console.error('ERROR:', e);
    }
}
main();
