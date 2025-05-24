// // src/app/api/seed/route.ts
// import { NextResponse } from 'next/server';
// import { seedPosts } from '@/app/actions/post.actions';
// import { seedUsers } from '@/app/actions/user.actions'; // Import seedUsers

// export async function GET() {
//   console.log('API route /api/seed accessed. Attempting to seed database...');
  
//   try {
//     // First seed users, then posts, as posts might depend on users (authors)
//     const userSeedResult = await seedUsers();
//     console.log('User seeding result:', userSeedResult);

//     const postSeedResult = await seedPosts();
//     console.log('Post seeding result:', postSeedResult);
    
//     if (userSeedResult.success && postSeedResult.success) {
//       return NextResponse.json({ 
//         message: `Database seeding process completed. Users: ${userSeedResult.message}. Posts: ${postSeedResult.message}`,
//         userCount: userSeedResult.count,
//         postCount: postSeedResult.count 
//       }, { status: 200 });
//     } else {
//         let combinedMessage = "";
//         if(!userSeedResult.success) combinedMessage += `User seeding failed: ${userSeedResult.message || 'Unknown error'}. `;
//         if(!postSeedResult.success) combinedMessage += `Post seeding failed: ${postSeedResult.message || 'Unknown error'}.`;

//       return NextResponse.json({ 
//         message: 'Database seeding partially failed or completed with issues.', 
//         details: combinedMessage,
//         userResult: userSeedResult,
//         postResult: postSeedResult,
//       }, { status: postSeedResult.success || userSeedResult.success ? 207 : 500 }); // 207 Multi-Status if one succeeded
//     }
//   } catch (error) {
//     console.error('Critical error in /api/seed route during seeding:', error);
//     const errorMessage = error instanceof Error ? error.message : String(error);
//     return NextResponse.json({ 
//       message: 'An unexpected critical error occurred during the seeding process.', 
//       error: errorMessage 
//     }, { status: 500 });
//   }
// }
