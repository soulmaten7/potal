import { redirect } from 'next/navigation';

// CW37-Gap2: Redirect bare /playground to new workspace
export default function PlaygroundRoot() {
  redirect('/workspace/export');
}
