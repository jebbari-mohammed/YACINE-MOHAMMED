document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('#usersTable tbody');
    const addRowBtn = document.getElementById('addRowBtn');
    const generateBtn = document.getElementById('generateBtn');
    const generateReportBtn = document.getElementById('generateReportBtn');

    // Add initial row
    addRow();

    addRowBtn.addEventListener('click', () => addRow()); // Call addRow without data for a new empty row
    generateBtn.addEventListener('click', generatePDF);
    generateReportBtn.addEventListener('click', generateReportPDF);

    function addRow(data = null) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" class="input-name" placeholder="Nom et Prénom" value="${data ? data.name : ''}"></td>
            <td><input type="text" class="input-matricule" placeholder="Matricule" value="${data ? data.matricule : ''}"></td>
            <td><input type="text" class="input-lieu" placeholder="Lieu" value="${data ? data.lieu : ''}"></td>
            <td><input type="text" class="input-motif" placeholder="Motif" value="${data ? data.motif : ''}"></td>
            <td><input type="date" class="input-date-depart" value="${data ? data.dateDepart : ''}"></td>
            <td><input type="date" class="input-date-retour" value="${data ? data.dateRetour : ''}"></td>
            <td>
                <button class="btn-icon btn-duplicate" title="Dupliquer">📋</button>
                <button class="btn-icon btn-remove" title="Supprimer">🗑️</button>
            </td>
        `;

        // Add event listeners for buttons
        tr.querySelector('.btn-remove').addEventListener('click', function () {
            if (tableBody.children.length > 1) {
                tr.remove();
            } else {
                alert("Vous devez avoir au moins un employé.");
            }
        });

        tr.querySelector('.btn-duplicate').addEventListener('click', function () {
            const rowData = {
                name: tr.querySelector('.input-name').value,
                matricule: tr.querySelector('.input-matricule').value,
                lieu: tr.querySelector('.input-lieu').value,
                motif: tr.querySelector('.input-motif').value,
                dateDepart: tr.querySelector('.input-date-depart').value,
                dateRetour: tr.querySelector('.input-date-retour').value
            };
            const newRow = addRow(rowData);
            tr.parentNode.insertBefore(newRow, tr.nextSibling);
        });

        tableBody.appendChild(tr);
        return tr;
    }

    function generatePDF() {
        const rows = document.querySelectorAll('#usersTable tbody tr');
        const templateContainer = document.getElementById('pdf-template-container');
        const printContainer = document.createElement('div');

        const today = new Date().toLocaleDateString('fr-FR');

        // Filter valid rows first to know total count
        const validRows = Array.from(rows).filter(row => {
            const name = row.querySelector('.input-name').value;
            const matricule = row.querySelector('.input-matricule').value;
            return name || matricule;
        });

        if (validRows.length === 0) {
            alert("Veuillez remplir au moins une ligne.");
            return;
        }

        const totalPages = validRows.length;

        validRows.forEach((row, index) => {
            const name = row.querySelector('.input-name').value;
            const matricule = row.querySelector('.input-matricule').value;
            const lieu = row.querySelector('.input-lieu').value;
            const motif = row.querySelector('.input-motif').value;
            const dateDepart = row.querySelector('.input-date-depart').value;
            const dateRetour = row.querySelector('.input-date-retour').value;

            const clone = templateContainer.querySelector('.mission-order-page').cloneNode(true);

            clone.querySelector('.data-name').textContent = name;
            clone.querySelector('.data-matricule').textContent = matricule;
            clone.querySelector('.data-lieu').textContent = lieu;
            clone.querySelector('.data-motif').textContent = motif;
            clone.querySelector('.data-date-depart').textContent = formatDate(dateDepart);
            clone.querySelector('.data-date-retour').textContent = formatDate(dateRetour);
            clone.querySelector('.data-fait-le').textContent = formatDate(dateDepart);

            // Update page number
            clone.querySelector('.page-number').textContent = `Page ${index + 1} sur ${totalPages}`;

            if (index < validRows.length - 1) {
                clone.classList.add('html2pdf__page-break');
            }

            printContainer.appendChild(clone);
        });

        const opt = {
            margin: 0,
            filename: 'ordres_de_mission.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'] }
        };

        html2pdf().set(opt).from(printContainer).save();
    }

    function generateReportPDF() {
        const rows = document.querySelectorAll('#usersTable tbody tr');
        const templateContainer = document.getElementById('report-template-container');
        const printContainer = document.createElement('div');

        // Group data by matricule
        const employees = {};

        rows.forEach(row => {
            const name = row.querySelector('.input-name').value;
            const matricule = row.querySelector('.input-matricule').value;
            const dateDepart = row.querySelector('.input-date-depart').value;
            const motif = row.querySelector('.input-motif').value;

            if (name || matricule) {
                if (!employees[matricule]) {
                    employees[matricule] = {
                        name: name,
                        matricule: matricule,
                        missions: []
                    };
                }
                employees[matricule].missions.push({
                    date: dateDepart,
                    motif: motif
                });
            }
        });

        const matricules = Object.keys(employees);

        if (matricules.length === 0) {
            alert("Veuillez remplir au moins une ligne.");
            return;
        }

        const MAX_ROWS_PER_PAGE = 15; // Safe limit for A4

        matricules.forEach((mat, empIndex) => {
            const employee = employees[mat];
            const missions = employee.missions;

            // Calculate number of pages needed
            const pageCount = Math.ceil(missions.length / MAX_ROWS_PER_PAGE) || 1;

            for (let i = 0; i < pageCount; i++) {
                const clone = templateContainer.querySelector('.mission-report-page').cloneNode(true);

                clone.querySelector('.data-name').textContent = employee.name;
                clone.querySelector('.data-matricule').textContent = employee.matricule;

                // Get the slice of missions for this page
                const start = i * MAX_ROWS_PER_PAGE;
                const end = start + MAX_ROWS_PER_PAGE;
                const pageMissions = missions.slice(start, end);

                // Clear existing rows in the clone
                const tbody = clone.querySelector('.report-table tbody');
                tbody.innerHTML = '';

                // Generate exactly MAX_ROWS_PER_PAGE rows
                for (let r = 0; r < MAX_ROWS_PER_PAGE; r++) {
                    const tr = document.createElement('tr');

                    if (r < pageMissions.length) {
                        const mission = pageMissions[r];
                        tr.innerHTML = `
                            <td>${formatDate(mission.date)}</td>
                            <td>08 H 00</td>
                            <td>17 H 00</td>
                            <td>${mission.motif}</td>
                        `;
                    } else {
                        // Empty row
                        tr.innerHTML = `
                            <td>&nbsp;</td>
                            <td></td>
                            <td></td>
                            <td></td>
                        `;
                    }
                    tbody.appendChild(tr);
                }

                // Add page break if it's not the very last page of the very last employee
                if (empIndex < matricules.length - 1 || i < pageCount - 1) {
                    clone.classList.add('html2pdf__page-break');
                }

                printContainer.appendChild(clone);
            }
        });

        const opt = {
            margin: 0,
            filename: 'rapports_de_mission.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'] }
        };

        html2pdf().set(opt).from(printContainer).save();
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
    }
});
