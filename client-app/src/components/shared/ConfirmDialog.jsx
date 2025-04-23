export const ConfirmDialog = ({
  isOpen,
  message,
  okMessage = 'Yes',
  cancelMessage = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog">
        <p>{message}</p>
        <div className="actions">
          <button className="btn btn-delete" onClick={onConfirm}>
            {okMessage}
          </button>
          <button className="btn btn-cancel" onClick={onCancel}>
            {cancelMessage}
          </button>
        </div>
      </div>
    </div>
  );
};
