export function requestStatusClass(status: string): string {
  switch (status) {
    case 'approved':
      return 'inrtStatusPill inrtStatusApproved';
    case 'rejected':
      return 'inrtStatusPill inrtStatusRejected';
    case 'processing':
      return 'inrtStatusPill inrtStatusProcessing';
    default:
      return 'inrtStatusPill inrtStatusPending';
  }
}
