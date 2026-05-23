# Security Specifications & Threat Model (TDD)

## 1. Data Invariants

1. **User Identity Invariant**: A user's profile can only be modified by the matching authenticated user UID. Users cannot self-escalate to `isAdmin = true`.
2. **Access Derivation Invariant**: A user's prediction data at `/users/{userId}/predictions/{groupId}` belongs to `userId`. Only `userId` can read or write their predictions.
3. **Group Ownership & Membership Invariants**:
   - Only the group owner can update group properties or name.
   - Any signed-in user can query/read groups.
   - Users can only join a group (adding their uid to `memberIds`) or request to join (adding their uid to `pendingMemberIds`). They cannot add other users or arbitrarily modify other users' roles.
4. **Locks and Actual Result Invariants**: Only administrators can modify matches, global locks, and actual real tournament results. Regular users have read-only access to matches, locks, and actual extras.
5. **Prediction Timeliness Invariant**: Users cannot create or update predictions for a stage if that stage is locked (e.g. `isGroupStageLocked` or `isKnockoutStageLocked` in `/locks/global`).

---

## 2. The "Dirty Dozen" Threat Payloads

Here are 12 malicious payloads designed to bypass client-side rules and exploit the database. Our rules must successfully block these:

1. **Privilege Escalation**: Regular user attempts to write a user document at `/users/{userId}` with `"isAdmin": true`.
2. **Identity Theft**: Authenticated user `UID_A` attempts to edit user profile `/users/UID_B`.
3. **Spoofed Rating/Points injection**: An malicious user tries to directly write a high score map into their own `/users/{userId}` profile document.
4. **Group Name Hijack**: A group member (who is NOT the owner) attempts to change the name of the group.
5. **Unauthorized Group Member Overwrite**: A hostile user attempts to kick members from a group by sending an empty `memberIds` array.
6. **Poison Document ID (Junk Inject)**: Attempting to create a group with a 1.5KB string containing junk characters as the document ID.
7. **Bypass Locks (Late Prediction)**: A user attempts to submit a prediction at `/users/{userId}/predictions/{groupId}` when `locks/global` has `isGroupStageLocked: true`.
8. **Malicious Match Modification**: A participant attempts to write goals into `/matches/match_123` to manipulate points.
9. **Malicious Global Lock Hijack**: Attempt to unlock knockout predictions or group creations to insert outdated scores.
10. **Spoofing Someone Else's Prediction**: Authenticated user `UID_A` attempts to write predictions to `/users/UID_B/predictions/scalos`.
11. **Shadow Group Invite Code Leak**: Attempting to query all groups' invite codes directly with broad listings.
12. **Tamper with Actual Extras**: Attempting to write into `/extras/global` to set himself as the top scorer or champion predictor.

---

## 3. Security Rule Implementations

We will enforce these through rigorous rules in `firestore.rules`.
