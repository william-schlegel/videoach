type Props = { pages: string[] };

const PageNavigation = ({ pages }: Props) => {
  return <div>{pages.toString()}</div>;
};

export default PageNavigation;
