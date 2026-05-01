# Firestore Security Specification

## Data Invariants
1. **User Profile**: A user profile must have the same ID as the authenticated `uid`. Once created, the `uid` and `email` are immutable.
2. **Project**: A project must belong to a valid `userId` which matches the creator's `uid`.
3. **Immutability**: `userId` and `createdAt` are immutable once a project is saved.
4. **Consistency**: User can only read and write their own projects.

## The "Dirty Dozen" Payloads (Red Team Test Cases)
1. **Identity Spoofing (Create)**: Attempt to create a project with a `userId` that isn't mine.
2. **Identity Spoofing (Update)**: Attempt to change the `userId` of an existing project.
3. **Privilege Escalation**: Attempt to read another user's project by guessing the ID.
4. **Shadow Field Injection**: Attempt to create a project with an extra field `isPremium: true`.
5. **Schema Poisoning**: Attempt to set `clips` to a string instead of an array.
6. **Resource Exhaustion**: Send a 1MB string as the `songDescription`.
7. **Bypassing Verification**: Attempt a write with `email_verified: false` (if required).
8. **Orphaned Record**: Attempt to create a project for a non-existent user (though in this flat structure, existence check on users might be overkill, but let's assume we want valid users).
9. **State Shortcutting**: If status existed, skipping steps. (Not applicable here).
10. **Immutable Field Tampering**: Attempt to change `createdAt` timestamp.
11. **Type Mismatch**: Sending a boolean for the `title`.
12. **Null ID Poisoning**: Using a path variable with malicious characters.

## The Test Runner (firestore.rules.test.ts)
```typescript
// This file would contain the logic to run the above payloads against the emulator
// For this applet, we will ensure the rules handle these cases.
```
