import React from 'react';
import { Modal, Button } from 'react-bootstrap';

interface ConfirmDialogProps {
  show: boolean;
  title: string;
  message: string;
  onHide: () => void;
  onConfirm: () => void;
  variant?: 'danger' | 'primary';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ 
  show, 
  title, 
  message, 
  onHide, 
  onConfirm, 
  variant = 'primary' 
}) => {
  return (
    <Modal show={show} onHide={onHide} centered size="sm">
      <Modal.Header closeButton closeVariant="white" style={{ borderBottom: 'none' }}>
        <Modal.Title style={{ fontSize: '1.1rem', fontWeight: 600 }}>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        {message}
      </Modal.Body>
      <Modal.Footer style={{ borderTop: 'none', padding: '1rem 1.5rem' }}>
        <Button variant="link" onClick={onHide} style={{ textDecoration: 'none', color: 'var(--text-muted)' }}>
          Cancel
        </Button>
        <Button 
          variant={variant} 
          onClick={onConfirm}
          className={variant === 'primary' ? 'btn-primary-custom' : ''}
          style={variant === 'danger' ? { backgroundColor: 'var(--danger)', border: 'none' } : {}}
        >
          Confirm
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmDialog;
