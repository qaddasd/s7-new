/**
 * Export utilities for attendance journals and reports
 */

/**
 * Convert data to CSV format
 */
export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) {
    throw new Error("No data to export")
  }

  // Get headers from first object
  const headers = Object.keys(data[0])
  
  // Create CSV content
  const csvContent = [
    headers.join(","), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escape commas and quotes in values
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(",")
    )
  ].join("\n")

  // Create blob and download
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Export attendance journal to CSV
 */
export function exportAttendanceToCSV(
  students: Array<{ id: string; name: string }>,
  dates: string[],
  attendance: Record<string, Record<string, { status: string }>>,
  filename: string = "attendance"
) {
  const data = students.map(student => {
    const row: any = { "Ученик": student.name }
    
    dates.forEach(date => {
      const dateKey = date
      const status = attendance[dateKey]?.[student.id]?.status || "absent"
      const statusMap: Record<string, string> = {
        present: "✓",
        late: "⏰",
        absent: "❌",
        excused: "У",
      }
      row[date] = statusMap[status] || "-"
    })
    
    // Calculate totals
    const totalPresent = dates.filter(d => attendance[d]?.[student.id]?.status === "present").length
    const totalLate = dates.filter(d => attendance[d]?.[student.id]?.status === "late").length
    const totalAbsent = dates.filter(d => attendance[d]?.[student.id]?.status === "absent").length
    const percentage = dates.length > 0 ? Math.round((totalPresent / dates.length) * 100) : 0
    
    row["Присутствовал"] = totalPresent
    row["Опоздал"] = totalLate
    row["Отсутствовал"] = totalAbsent
    row["% посещаемости"] = `${percentage}%`
    
    return row
  })

  exportToCSV(data, filename)
}

/**
 * Export quiz results to CSV
 */
export function exportQuizResultsToCSV(
  results: Array<{
    studentName: string
    score: number
    totalQuestions: number
    date: string
    lessonTitle: string
  }>,
  filename: string = "quiz-results"
) {
  const data = results.map(result => ({
    "Ученик": result.studentName,
    "Урок": result.lessonTitle,
    "Дата": new Date(result.date).toLocaleDateString("ru-RU"),
    "Баллы": result.score,
    "Всего вопросов": result.totalQuestions,
    "Процент": `${Math.round((result.score / result.totalQuestions) * 100)}%`,
  }))

  exportToCSV(data, filename)
}

/**
 * Export class summary report to CSV
 */
export function exportClassSummaryToCSV(
  summary: {
    className: string
    totalLessons: number
    averageAttendance: number
    averageQuizScore: number
    activeStudents: number
    dateRange: { from: string; to: string }
  },
  filename: string = "class-summary"
) {
  const data = [{
    "Класс": summary.className,
    "Всего уроков": summary.totalLessons,
    "Средняя посещаемость": `${Math.round(summary.averageAttendance)}%`,
    "Средний балл по квизам": `${Math.round(summary.averageQuizScore)}%`,
    "Активных учеников": summary.activeStudents,
    "Период": `${summary.dateRange.from} - ${summary.dateRange.to}`,
  }]

  exportToCSV(data, filename)
}

/**
 * Generate simple PDF (HTML to PDF using print)
 * Note: For production, consider using a library like jsPDF or pdfmake
 */
export function exportToPDF(htmlContent: string, filename: string) {
  const printWindow = window.open("", "_blank")
  if (!printWindow) {
    throw new Error("Failed to open print window. Please allow popups.")
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${filename}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #00a3ff;
          color: white;
        }
        tr:nth-child(even) {
          background-color: #f2f2f2;
        }
        h1, h2 {
          color: #00a3ff;
        }
        .summary {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 5px;
          margin: 15px 0;
        }
        @media print {
          button { display: none; }
        }
      </style>
    </head>
    <body>
      ${htmlContent}
      <div style="margin-top: 20px;">
        <button onclick="window.print()">Печать</button>
        <button onclick="window.close()">Закрыть</button>
      </div>
    </body>
    </html>
  `)
  
  printWindow.document.close()
}

/**
 * Export attendance journal to PDF
 */
export function exportAttendanceToPDF(
  students: Array<{ id: string; name: string }>,
  dates: string[],
  attendance: Record<string, Record<string, { status: string }>>,
  className: string,
  filename: string = "attendance"
) {
  const statusMap: Record<string, string> = {
    present: "✓",
    late: "⏰",
    absent: "❌",
    excused: "У",
  }

  const tableRows = students.map(student => {
    const cells = dates.map(date => {
      const status = attendance[date]?.[student.id]?.status || "absent"
      return `<td style="text-align: center;">${statusMap[status] || "-"}</td>`
    }).join("")
    
    const totalPresent = dates.filter(d => attendance[d]?.[student.id]?.status === "present").length
    const percentage = dates.length > 0 ? Math.round((totalPresent / dates.length) * 100) : 0
    
    return `
      <tr>
        <td><strong>${student.name}</strong></td>
        ${cells}
        <td style="text-align: center;"><strong>${totalPresent}/${dates.length}</strong></td>
        <td style="text-align: center;"><strong>${percentage}%</strong></td>
      </tr>
    `
  }).join("")

  const htmlContent = `
    <h1>Журнал посещаемости</h1>
    <div class="summary">
      <p><strong>Класс:</strong> ${className}</p>
      <p><strong>Период:</strong> ${dates[0] || "-"} - ${dates[dates.length - 1] || "-"}</p>
      <p><strong>Всего уроков:</strong> ${dates.length}</p>
      <p><strong>Учеников:</strong> ${students.length}</p>
      <p><strong>Дата формирования:</strong> ${new Date().toLocaleString("ru-RU")}</p>
    </div>
    <table>
      <thead>
        <tr>
          <th>Ученик</th>
          ${dates.map(d => `<th style="text-align: center;">${new Date(d).toLocaleDateString("ru-RU")}</th>`).join("")}
          <th style="text-align: center;">Всего</th>
          <th style="text-align: center;">%</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  `

  exportToPDF(htmlContent, filename)
}
