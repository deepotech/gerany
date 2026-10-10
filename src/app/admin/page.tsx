import { notFound, redirect } from 'next/navigation';
import { isAuthenticatedAdmin } from '@/lib/auth';

export default function AdminRedirect() {
  if (!isAuthenticatedAdmin()) {
    notFound();
  }
  redirect('/de/admin');
}

