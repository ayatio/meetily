'use client';

// Otto Scribe Coach — the mobile PWA client route.
import CoachView from '@/components/Otto/CoachView';
import PwaRegister from '@/components/Otto/PwaRegister';

export default function CoachPage() {
  return (
    <>
      <PwaRegister />
      <CoachView />
    </>
  );
}
