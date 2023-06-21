const packetName = window.location.pathname.split('/').pop();
const packetTitle = titleCase(packetName);

document.getElementById('packet-name').textContent = packetTitle;

fetch('/api/geoword/get-divisions?' + new URLSearchParams({ packetName }))
    .then(response => response.json())
    .then(data => {
        const { divisions } = data;
        const divisionSelect = document.getElementById('division');
        divisions.forEach(division => {
            const option = document.createElement('option');
            option.value = division;
            option.textContent = division;
            divisionSelect.appendChild(option);
        });
    });

document.getElementById('form').addEventListener('submit', event => {
    // Need event.preventDefault() for firefox only!!!
    // See https://stackoverflow.com/a/70780452
    event.preventDefault();
    event.stopPropagation();

    const division = document.getElementById('division').value;
    fetch('/api/geoword/record-division?', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ division, packetName }),
    }).then(response => {
        if (response.ok) {
            window.location.href = '/geoword/game/' + packetName;
        } else {
            alert('Something went wrong. Please try again.');
        }
    });
});
