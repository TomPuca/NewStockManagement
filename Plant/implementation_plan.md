# Implementation Plan - Google Authentication with Restricted Access

Add Google Sign-In authentication to the Stock Management Dashboard. Access will be strictly restricted to the user with the email address `hung1504@gmail.com`. The session will be persisted automatically using Firebase's native local storage persistence.

## User Review Required

> [!IMPORTANT]
> **Firebase Console Setup Required:**
> To enable Google Authentication, you must complete the following steps in your Firebase Console:
> 1. Go to **Firebase Console > Authentication > Sign-in method**.
> 2. Click **Add new provider** and select **Google**. Enable it.
> 3. Fill in your project support email and save.
> 4. Ensure that `localhost` and your deployed domain `tompuca.github.io` are listed under **Authorized domains** in the Authentication settings.

> [!WARNING]
> **Access Whitelist:**
> Only the email `hung1504@gmail.com` will be granted access to the application. Any other Google account will trigger an error message and be signed out automatically.

## Open Questions

> [!NOTE]
> We will use Firebase's default `browserLocalPersistence`, which keeps the user signed in even if they close or refresh the browser. No additional settings are needed on your end for this.
>
> **Do you want to display the user's Google avatar or display name in the header of the app?**
> We can add a clean user profile section in the header next to the Log Out button.

---

## Proposed Changes

### Firebase Configuration

#### [MODIFY] [firebase.js](file:///Volumes/Setup/Code/React/NewStockManagement/src/firebase.js)
- Import `getAuth` and `GoogleAuthProvider` from `"firebase/auth"`.
- Initialize `auth` and `googleProvider`.
- Export `auth` and `googleProvider`.

### Authentication Components

#### [NEW] [Login.jsx](file:///Volumes/Setup/Code/React/NewStockManagement/src/components/Login.jsx)
- Create a premium dark-themed Glassmorphism Login component.
- Display a polished card with:
  - Gradient title: **Stock Portal Login**
  - Sign-in button with a Google icon.
  - Error messages if the user logs in with an unauthorized email or if the sign-in fails.
- Implement the sign-in logic using `signInWithPopup(auth, googleProvider)`.

#### [NEW] [Login.css](file:///Volumes/Setup/Code/React/NewStockManagement/src/components/Login.css)
- Implement matching premium visual styles, alignment, hover animations, and card layouts for the Login view.

### Main Application Layout

#### [MODIFY] [App.jsx](file:///Volumes/Setup/Code/React/NewStockManagement/src/App.jsx)
- Import `auth` from `./firebase` and Firebase auth methods (`onAuthStateChanged`, `signOut`).
- Add states: `user` (holds the authenticated user object) and `loading` (boolean for checking initial auth state).
- Use `useEffect` to listen to auth state changes using `onAuthStateChanged`.
- Add email validation: If `user.email === 'hung1504@gmail.com'`, keep the user signed in. Otherwise, call `signOut(auth)` immediately and display an error.
- Render the `Login` component if the user is not authenticated.
- If `loading` is active, display a premium loading spinner using CSS.
- Add a user information and "Sign Out" button in the app header for easy logout.

---

## Verification Plan

### Automated Tests
- Build verification: Run `npm run build` to ensure there are no TypeScript/Vite build errors.

### Manual Verification
1. **Initial Access:** Open the app. It should display the Google Login screen.
2. **Unauthorized Access:** Log in using a Google account other than `hung1504@gmail.com`. The app should display an "Access Denied" error message, sign the account out, and stay on the login screen.
3. **Authorized Access:** Log in using `hung1504@gmail.com`. The app should load the full dashboard.
4. **Session Persistence:** Close the browser tab and reopen it, or refresh the page. The app should load the dashboard directly without showing the login screen.
5. **Logout:** Click the "Sign Out" button in the header. The app should sign the user out and return to the login screen.
