'use client';

import { storage } from '@/lib/firebase';
import { ref, uploadBytes } from 'firebase/storage';

export default function DebugFirebasePage() {
  const testUpload = async () => {
    try {
      console.log('Testing Firebase Storage upload...');

      // Create a tiny test file
      const testData = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const testBlob = new Blob([testData], { type: 'text/plain' });

      // Try to upload to test location
      const storageRef = ref(storage, 'test/hello.txt');
      await uploadBytes(storageRef, testBlob);

      console.log('✅ Upload successful!');
      alert('✅ Firebase Storage is working! Your rules are correct.');
    } catch (error: any) {
      console.error('❌ Upload failed:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);

      alert(`❌ Upload failed: ${error.code}\n\nCheck console for details.`);
    }
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-4">
          Firebase Debug Page
        </h1>

        <div className="bg-halo-dark-light p-6 rounded-lg space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">
              Environment Variables
            </h2>
            <div className="bg-black p-4 rounded font-mono text-xs space-y-1">
              <div className="text-halo-medium">
                API Key: {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing'}
              </div>
              <div className="text-halo-medium">
                Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '❌ Missing'}
              </div>
              <div className="text-halo-medium">
                Storage Bucket: {process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '❌ Missing'}
              </div>
              <div className="text-halo-medium">
                App ID: {process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing'}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">
              Test Upload
            </h2>
            <button
              onClick={testUpload}
              className="px-6 py-3 bg-halo-ice text-black font-semibold rounded-lg hover:bg-halo-ice/90"
            >
              Test Firebase Storage Upload
            </button>
            <p className="text-sm text-halo-medium mt-2">
              This will try to upload a tiny test file. Check console (F12) for results.
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500 rounded-lg">
          <p className="text-yellow-400 text-sm">
            <strong>Open Browser Console (F12)</strong> to see detailed error messages
          </p>
        </div>
      </div>
    </div>
  );
}
