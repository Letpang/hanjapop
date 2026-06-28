const BadgeModalTitle = ({ status, title }) => (
  <div className="text-center flex flex-col items-center">
    <h2
      className="text-2xl font-medium tracking-normal bg-gradient-to-br from-[#2D3142] to-[#4F5D75] bg-clip-text text-transparent drop-shadow-sm dark:text-white dark:drop-shadow-md"
      style={{ paddingBottom: '2px' }}
    >
      {title}
    </h2>
    <div className="mt-2 px-3 py-1 rounded-full text-base font-normal bg-gradient-to-r from-[#7C83FF] to-[#9B8CFF] text-white shadow-md">
      {status}
    </div>
  </div>
);

export default BadgeModalTitle;
