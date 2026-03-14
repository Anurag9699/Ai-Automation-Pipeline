import fetch from "node-fetch";

async function main() {
    try {
        const res = await fetch("http://localhost:4000/api/content");
        const text = await res.text();
        console.log("Status:", res.status);
        if (res.status !== 200) {
            console.log("Error body:", text);
            return;
        }
        const data = JSON.parse(text);
        console.log("Items count:", data.length);
        
        // Simulating the renderCards template logic to find any throwing errors
        let htmlChunks = data.map((item, i) => {
            return `
            <div class="card" style="animation-delay: ${i * 0.08}s">
                ${item.imageUrl ? `<img class="card-bg" src="${item.imageUrl}" alt="" />` : ''}
                <div class="card-badges">
                    ${item.signalBadge ? `<span class="signal-badge">${item.signalBadge}</span>` : ''}
                    <span class="category-tag">${item.category}</span>
                    <span class="score-badge">${item.score}/10</span>
                </div>
                <div class="card-headline">${item.headline || item.title}</div>
                ${item.hookSentence ? `<div class="card-hook">${item.hookSentence}</div>` : ''}
                <div class="card-trivia">${item.trivia}</div>
                <div class="card-footer">
                    <a class="card-source" href="${item.sourceUrl}" target="_blank" rel="noopener">source</a>
                    <span class="card-time">${item.createdAt}</span>
                </div>
            </div>`;
        });
        console.log("Rendered HTML chunk count:", htmlChunks.length);
        
        const resStats = await fetch("http://localhost:4000/api/stats");
        const statsData = await resStats.json();
        console.log("Stats Data:", statsData);
        
    } catch(e) {
        console.error(e);
    }
}
main();
