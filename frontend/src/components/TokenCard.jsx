// import React from 'react';

const TokenCard = ({ name, symbol, address }) => {
  return (
    <div className="border rounded-xl p-4 shadow hover:shadow-md transition bg-white">
      <div className="flex items-center space-x-4 mb-2">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold">
          {symbol?.[0] || "T"}
        </div>
        <div>
          <h3 className="text-lg font-semibold">{name}</h3>
          <p className="text-gray-600 text-sm">{symbol}</p>
        </div>
      </div>
      <p className="text-xs break-all text-gray-500">{address}</p>
    </div>
  );
};

export default TokenCard; 