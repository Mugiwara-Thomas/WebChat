import React from "react";

const MyTextField = ({ label, value, onChange, style }) => {
  return (
    <div style={style}>
      <label>{label}</label>
      <input
        type="text"
        value={value}
        onChange={onChange}
      />
    </div>
  );
};

export default MyTextField;
