import React, { useState } from 'react';

export const CommentConfirmDialog = ({
    isOpen,
    message,
    comment,
    setComment,
    okMessage = 'Confirm',
    cancelMessage = 'Cancel',
    onConfirm,
    onCancel
}) => {

    if (!isOpen) {
        return null;
    }

    return (
        <div className="confirm-dialog-overlay">
            <div className="confirm-dialog">
                <p>{message}</p>
                <textarea
                    className="comment-textarea"
                    placeholder="Write a comment..."
                    value={comment}
                    rows={10}
                    cols={50}
                    onChange={(e) => setComment(e.target.value)}
                />
                <div className="actions">
                    <button className="btn btn-delete" onClick={() => onConfirm(comment)}>
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


