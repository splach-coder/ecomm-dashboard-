const CameraErrorLabel = ({ error }) => {
  if (!error) return null;
  
  return (
    <div className="absolute bottom-4 left-0 right-0 bg-red-500 text-white p-2 text-center">
      {error}
      <button 
        onClick={() => window.location.reload()} 
        className="ml-2 px-2 py-1 bg-white text-red-500 rounded"
      >
        Retry
      </button>
    </div>
  );
};