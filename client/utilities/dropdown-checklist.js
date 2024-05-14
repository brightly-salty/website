function attachDropdownChecklist() {
    Array.from(document.querySelectorAll('.checkbox-menu input[type=\'checkbox\']')).forEach(input => {
        input.addEventListener('change', function () {
            if (input.checked) {
                input.closest('li').classList.add('active');
            } else {
                input.closest('li').classList.remove('active');
            }
        });
    });

    Array.from(document.querySelectorAll('.allow-focus')).forEach(dropdown => {
        dropdown.addEventListener('click', function (e) {
            e.stopPropagation();
        });
    });
}


function getDropdownValues(id) {
    const values = [];
    Array.from(document.getElementById(id).children).forEach(li => {
        const input = li.querySelector('input');
        if (input.checked) {
            values.push(parseInt(input.value));
        }
    });
    return values;
}


export { attachDropdownChecklist, getDropdownValues };
