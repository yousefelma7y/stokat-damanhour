import React from "react";

const Title = ({ title, subTitle, button = false, count = 0, withoutCount = false }) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-8 mt-4 md:mt-0 gap-4">
      <div>
        <h1 className="font-bold text-gray-900 text-xl sm:text-3xl space-x-2">
          <span>{title}</span>
          {mounted && !withoutCount && <span suppressHydrationWarning>({count.toLocaleString("ar-EG")})</span>}
        </h1>
        <p className="text-gray-500 text-sm sm:text-base">{subTitle}</p>
      </div>
      <div className="w-full sm:w-auto">
        {button && button}
      </div>
    </div>
  );
};

export default Title;
