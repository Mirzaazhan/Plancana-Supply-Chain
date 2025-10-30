// 'use client'

// import { signIn } from 'next-auth/react'
// import { Button } from '@/components/ui/button'

// export function GoogleButton() {
//   return (
//     <Button 
//         variant="outline" 
//         className="w-full"
//         type="button"
//         onClick={() => signIn("google", { callbackUrl: '/dashboard' })}
//         size="sm"
//     >
//         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24" height="24">
//             <path fill="#EA4335" d="M24 9.5c3.26 0 6.19 1.14 8.49 3.01l6.35-6.35C34.42 2.2 29.52 0 24 0 14.65 0 6.91 5.79 3.2 14.14l7.4 5.75C12.34 14.4 17.72 9.5 24 9.5z"/>
//             <path fill="#4285F4" d="M46.1 24.5c0-1.63-.15-3.19-.42-4.69H24v9.1h12.45c-.54 2.89-2.19 5.34-4.65 7.01l7.29 5.65c4.25-3.92 6.71-9.7 6.71-16.07z"/>
//             <path fill="#FBBC05" d="M10.6 28.29a14.48 14.48 0 0 1 0-8.57l-7.4-5.75a24.001 24.001 0 0 0 0 20.07l7.4-5.75z"/>
//             <path fill="#34A853" d="M24 48c6.48 0 11.91-2.14 15.87-5.81l-7.29-5.65c-2.02 1.35-4.59 2.15-8.58 2.15-6.28 0-11.66-4.9-13.39-11.39l-7.4 5.75C6.91 42.21 14.65 48 24 48z"/>
//         </svg>

//       <span>Sign in with Google</span>
//     </Button>
//   );
// }