export function ManualImportGuide(){
  return <section className="manual-guide" aria-label="Manual slot import guide">
      <p>In TTAP, adding slots manually means importing the HTML from your course timetable page. Use a regular browser for the source-copying steps below. In the desktop login view, you can use Preview courses from this page instead.</p>
      <ol>
        <li><strong>Log in.</strong> Sign in to the Course Registration System, then open the same page in a regular browser to copy its source.</li>
        <li><strong>Open Course Timetable Preview.</strong> Display the course timetable data you want to arrange.</li>
        <li><strong>Open the page source.</strong> In your browser, press <kbd>Ctrl + U</kbd> or choose View page source from the context menu.</li>
        <li><strong>Copy the source.</strong> Press <kbd>Ctrl + A</kbd>, then <kbd>Ctrl + C</kbd> in the source tab.</li>
        <li><strong>Return to TTAP.</strong> Choose Paste HTML, paste the source, then choose Preview import. Check the notes and choose Use these courses.</li>
        <li><strong>Include every page.</strong> If the preview has multiple pages, save each as an HTML file and import all pages together using HTML files. Importing a new set replaces the current courses.</li>
      </ol>
      <p>Your password stays in the UTAR website. Once imported, arranging a timetable works locally.</p>
  </section>;
}
