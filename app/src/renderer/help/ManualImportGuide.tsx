export function ManualImportGuide(){
  return <details className="manual-guide"><summary>How to add slots manually?</summary>
    <section aria-label="Manual slot import guide">
      <p>In TTAP, adding slots manually means importing the HTML from your course timetable page.</p>
      <ol>
        <li><strong>Log in.</strong> Open the Course Registration System using the link above and sign in with your UTAR account.</li>
        <li><strong>Open Course Timetable Preview.</strong> Display the course timetable data you want to arrange.</li>
        <li><strong>Open the page source.</strong> In your browser, press <kbd>Ctrl + U</kbd> or choose View page source from the context menu.</li>
        <li><strong>Copy the source.</strong> Press <kbd>Ctrl + A</kbd>, then <kbd>Ctrl + C</kbd> in the source tab.</li>
        <li><strong>Return to TTAP.</strong> Choose Paste HTML, paste the source, then choose Preview import. Check the notes and choose Use these courses.</li>
        <li><strong>Include every page.</strong> If the preview has multiple pages, save each as an HTML file and import all pages together using HTML files. Importing a new set replaces the current courses.</li>
      </ol>
      <p>Your password stays in the UTAR website. Once imported, arranging a timetable works locally.</p>
    </section>
  </details>;
}
