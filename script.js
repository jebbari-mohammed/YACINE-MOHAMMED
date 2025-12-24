document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('#usersTable tbody');
    const addRowBtn = document.getElementById('addRowBtn');
    const generateBtn = document.getElementById('generateBtn');

    // Add initial row
    addRow();

    addRowBtn.addEventListener('click', addRow);
    generateBtn.addEventListener('click', generatePDF);

    function addRow() {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" placeholder="Nom et Prénom" class="input-name"></td>
            <td><input type="text" placeholder="Matricule" class="input-matricule"></td>
            <td><input type="text" placeholder="Lieu" class="input-lieu"></td>
            <td><input type="text" placeholder="Motif" class="input-motif"></td>
            <td><input type="date" class="input-date-depart"></td>
            <td><input type="date" class="input-date-retour"></td>
            <td><button class="btn danger remove-btn">X</button></td>
        `;

        tr.querySelector('.remove-btn').addEventListener('click', () => {
            if (tableBody.children.length > 1) {
                tr.remove();
            } else {
                alert("Vous devez avoir au moins un employé.");
            }
        });

        tableBody.appendChild(tr);
    }

    function generatePDF() {
        const rows = document.querySelectorAll('#usersTable tbody tr');
        const templateContainer = document.getElementById('pdf-template-container');
        const printContainer = document.createElement('div');

        // Current date for "Fait le ..."
        const today = new Date().toLocaleDateString('fr-FR');

        let hasData = false;

        rows.forEach((row, index) => {
            const name = row.querySelector('.input-name').value;
            const matricule = row.querySelector('.input-matricule').value;
            const lieu = row.querySelector('.input-lieu').value;
            const motif = row.querySelector('.input-motif').value;
            const dateDepart = row.querySelector('.input-date-depart').value;
            const dateRetour = row.querySelector('.input-date-retour').value;

            if (name || matricule) { // Only process if there's some data
                hasData = true;
                // Clone the template
                const clone = templateContainer.querySelector('.mission-order-page').cloneNode(true);

                // Populate data
                clone.querySelector('.data-name').textContent = name;
                clone.querySelector('.data-matricule').textContent = matricule;
                clone.querySelector('.data-lieu').textContent = lieu;
                clone.querySelector('.data-motif').textContent = motif;
                clone.querySelector('.data-date-depart').textContent = formatDate(dateDepart);
                clone.querySelector('.data-date-retour').textContent = formatDate(dateRetour);
                clone.querySelector('.current-date').textContent = today;

                // Add page break after each page except the last one
                if (index < rows.length - 1) {
                    // clone.style.marginBottom = '20px'; // Removed to avoid overflow
                    clone.classList.add('html2pdf__page-break');
                }

                printContainer.appendChild(clone);
            }
        });

        if (!hasData) {
            alert("Veuillez remplir au moins une ligne.");
            return;
        }

        // Options for html2pdf
        const opt = {
            margin: 0,
            filename: 'ordres_de_mission.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'] }
        };

        // Generate PDF
        html2pdf().set(opt).from(printContainer).save();
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
    }
});
