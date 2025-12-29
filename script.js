document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('#usersTable tbody');
    const addRowBtn = document.getElementById('addRowBtn');
    const generateBtn = document.getElementById('generateBtn');
    const generateReportBtn = document.getElementById('generateReportBtn');

    // Add initial row
    addRow();

    addRowBtn.addEventListener('click', () => addRow());
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

    async function generatePDF() {
        const rows = document.querySelectorAll('#usersTable tbody tr');
        const templateContainer = document.getElementById('pdf-template-container');
        const { jsPDF } = window.jspdf;

        // Filter valid rows first
        const validRows = Array.from(rows).filter(row => {
            const name = row.querySelector('.input-name').value;
            const matricule = row.querySelector('.input-matricule').value;
            return name || matricule;
        });

        if (validRows.length === 0) {
            alert("Veuillez remplir au moins une ligne.");
            return;
        }

        // Loading State
        const originalText = generateBtn.textContent;
        generateBtn.textContent = `Génération... (0/${validRows.length})`;
        generateBtn.disabled = true;

        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const totalPages = validRows.length;
            const pageWidth = 210;
            const pageHeight = 297; // A4 height

            for (let i = 0; i < totalPages; i++) {
                const row = validRows[i];
                generateBtn.textContent = `Génération... (${i + 1}/${totalPages})`;

                // Populate Template
                const name = row.querySelector('.input-name').value;
                const matricule = row.querySelector('.input-matricule').value;
                const lieu = row.querySelector('.input-lieu').value;
                const motif = row.querySelector('.input-motif').value;
                const dateDepart = row.querySelector('.input-date-depart').value;
                const dateRetour = row.querySelector('.input-date-retour').value;

                const clone = templateContainer.querySelector('.mission-order-page').cloneNode(true);

                // Ensure the clone is visible for html2canvas but off-screen
                document.body.appendChild(clone);
                clone.style.position = 'fixed';
                clone.style.top = '-9999px';
                clone.style.left = '0';
                clone.style.zIndex = '-1000';

                clone.querySelector('.data-name').textContent = name;
                clone.querySelector('.data-matricule').textContent = matricule;
                clone.querySelector('.data-lieu').textContent = lieu;
                clone.querySelector('.data-motif').textContent = motif;
                clone.querySelector('.data-date-depart').textContent = formatDate(dateDepart);
                clone.querySelector('.data-date-retour').textContent = formatDate(dateRetour);
                clone.querySelector('.data-fait-le').textContent = formatDate(dateDepart);
                clone.querySelector('.page-number').textContent = `Page ${i + 1} sur ${totalPages}`;

                // Render Canvas
                const canvas = await html2canvas(clone, {
                    scale: 2, // quality
                    useCORS: true,
                    logging: false
                });

                const imgData = canvas.toDataURL('image/jpeg', 0.95);

                // Add to PDF
                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);

                // Cleanup DOM
                document.body.removeChild(clone);
            }

            pdf.save('ordres_de_mission.pdf');

        } catch (error) {
            console.error("PDF Error:", error);
            alert("Une erreur est survenue lors de la génération du PDF.");
        } finally {
            generateBtn.textContent = originalText;
            generateBtn.disabled = false;
        }
    }

    async function generateReportPDF() {
        const rows = document.querySelectorAll('#usersTable tbody tr');
        const templateContainer = document.getElementById('report-template-container');
        const { jsPDF } = window.jspdf;

        // Group data
        const employees = {};
        rows.forEach(row => {
            const name = row.querySelector('.input-name').value;
            const matricule = row.querySelector('.input-matricule').value;
            const dateDepart = row.querySelector('.input-date-depart').value;
            const motif = row.querySelector('.input-motif').value;

            if (name || matricule) {
                if (!employees[matricule]) employees[matricule] = { name, matricule, missions: [] };
                employees[matricule].missions.push({ date: dateDepart, motif: motif });
            }
        });

        const matricules = Object.keys(employees);

        if (matricules.length === 0) {
            alert("Veuillez remplir au moins une ligne.");
            return;
        }

        // Loading State
        const originalText = generateReportBtn.textContent;
        generateReportBtn.textContent = "Génération...";
        generateReportBtn.disabled = true;

        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = 210;
            const pageHeight = 297;
            const MAX_ROWS_PER_PAGE = 23;
            let firstPage = true;

            for (const mat of matricules) {
                const employee = employees[mat];
                const missions = employee.missions;
                const pageCount = Math.ceil(missions.length / MAX_ROWS_PER_PAGE) || 1;

                for (let i = 0; i < pageCount; i++) {
                    // Add page if not the very start
                    if (!firstPage) pdf.addPage();
                    firstPage = false;

                    const clone = templateContainer.querySelector('.mission-report-page').cloneNode(true);

                    document.body.appendChild(clone);
                    clone.style.position = 'fixed';
                    clone.style.top = '-9999px';
                    clone.style.left = '0';
                    clone.style.zIndex = '-1000';

                    clone.querySelector('.data-name').textContent = employee.name;
                    clone.querySelector('.data-matricule').textContent = employee.matricule;

                    // Table Rows
                    const start = i * MAX_ROWS_PER_PAGE;
                    const end = start + MAX_ROWS_PER_PAGE;
                    const pageMissions = missions.slice(start, end);
                    const tbody = clone.querySelector('.report-table tbody');
                    tbody.innerHTML = '';

                    for (let r = 0; r < MAX_ROWS_PER_PAGE; r++) {
                        const tr = document.createElement('tr');
                        if (r < pageMissions.length) {
                            const m = pageMissions[r];
                            tr.innerHTML = `<td>${formatDate(m.date)}</td><td>08 H 00</td><td>17 H 00</td><td>${m.motif}</td>`;
                        } else {
                            tr.innerHTML = `<td>&nbsp;</td><td></td><td></td><td></td>`;
                        }
                        tbody.appendChild(tr);
                    }

                    // Render
                    const canvas = await html2canvas(clone, {
                        scale: 2,
                        useCORS: true,
                        logging: false
                    });

                    const imgData = canvas.toDataURL('image/jpeg', 0.95);
                    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);

                    document.body.removeChild(clone);
                }
            }

            pdf.save('rapports_de_mission.pdf');

        } catch (error) {
            console.error("Report Error:", error);
            alert("Erreur lors de la génération du rapport.");
        } finally {
            generateReportBtn.textContent = originalText;
            generateReportBtn.disabled = false;
        }
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
    }
});
