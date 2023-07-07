const division = decodeURIComponent(window.location.search.slice(1));
const packetName = window.location.pathname.split('/')[3];
const packetTitle = titleCase(packetName);

document.getElementById('packet-name').textContent = packetTitle;
document.getElementById('division').textContent = division;

fetch('/api/geoword/leaderboard?' + new URLSearchParams({ packetName, division }))
    .then(response => response.json())
    .then(data => {
        const { leaderboard } = data;

        let innerHTML = '';
        for (const index in leaderboard) {
            const { username, numberCorrect, points, pointsPerTossup, averageCorrectCelerity } = leaderboard[index];

            innerHTML += `
                <tr>
                    <td>${parseInt(index) + 1}</td>
                    <th scope="row">${escapeHTML(username)}</th>
                    <td>${(averageCorrectCelerity ?? 0.0).toFixed(3)}</td>
                    <td>${numberCorrect}</td>
                    <td>${points}</td>
                    <td>${(pointsPerTossup ?? 0.0).toFixed(2)}</td>
                </tr>
            `;
        }
        document.getElementById('leaderboard-body').innerHTML = innerHTML;
    });
