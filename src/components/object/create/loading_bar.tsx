// LoadingBar.js

const LoadingBar = ({ progress }) => (
  <div style={{
    width: '300px', 
    height: '10px', 
    background: 'lightgrey', 
    position: 'relative',
  }}>
    <div style={{ 
      width: `${progress}%`, 
      height: '100%', 
      background: 'green',
      position: 'absolute',
      top: 0,
      left: 0,
    }} />
  </div>
);

export default LoadingBar;


