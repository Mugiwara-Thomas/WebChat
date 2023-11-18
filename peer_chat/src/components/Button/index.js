import React from "react";

const MyButton = ({ label, onClick, style }) => {
  return (
    <button style={style} onClick={onClick}>
      {label}
    </button>
  );
};

export default MyButton;
