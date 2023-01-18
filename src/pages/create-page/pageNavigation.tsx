type Props = { pages: string[] };

const PageNavigation = ({ pages }: Props) => {
  if (!Array.isArray(pages)) return <div>1</div>;
  return <div>{pages.toString()}</div>;
};

export default PageNavigation;
