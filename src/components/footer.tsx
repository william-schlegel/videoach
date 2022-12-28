export default function Footer() {
  return (
    <footer className="footer mt-auto gap-12 bg-neutral p-10 text-neutral-content">
      <div className="flex w-full justify-end">
        <i className="bx bxl-slack-old text-[60px]" />
        <p>
          Videoach
          <br />
          Gestion de clubs de sport
        </p>
      </div>
      <div>
        <span className="footer-title">Social</span>
        <div className="grid grid-flow-col gap-4">
          <a>
            <i className="bx bxl-twitter bx-sm" />
          </a>
          <a>
            <i className="bx bxl-youtube bx-sm" />{" "}
          </a>
          <a>
            <i className="bx bxl-facebook bx-sm" />{" "}
          </a>
        </div>
      </div>
    </footer>
  );
}
