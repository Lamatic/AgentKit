"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";

async function getAccessToken() {
  const session: any = await getServerSession(authOptions);
  if (!session?.accessToken) {
    throw new Error("Unauthorized: No access token found. Please sign in again.");
  }
  return session.accessToken;
}

export async function getGMBLocations() {
  try {
    const token = await getAccessToken();

    // 1. Fetch Accounts
    const accountsRes = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!accountsRes.ok) {
      const errBody = await accountsRes.text();
      console.error("GMB Accounts Error Body:", errBody);
      throw new Error(`Failed to fetch accounts: ${accountsRes.statusText}. Details: ${errBody}`);
    }
    const accountsData = await accountsRes.json();
    const accounts = accountsData.accounts || [];

    if (accounts.length === 0) {
      return { locations: [] };
    }

    // 2. Fetch Locations for the first account (ideally we should loop all accounts, but this covers most users)
    const accountName = accounts[0].name; 
    
    const locationsRes = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storeCode,storefrontAddress`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!locationsRes.ok) {
      throw new Error(`Failed to fetch locations: ${locationsRes.statusText}`);
    }
    
    const locationsData = await locationsRes.json();
    return { locations: locationsData.locations || [], accountName };

  } catch (error: any) {
    console.error("GMB API Error:", error.message);
    return { error: error.message };
  }
}

export async function getGMBReviews(accountName: string, locationName: string) {
  try {
    const token = await getAccessToken();
    
    const accountId = accountName.split('/')[1];
    const locationId = locationName.split('/')[1];
    
    const reviewsRes = await fetch(`https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!reviewsRes.ok) {
      const errBody = await reviewsRes.text();
      console.error("Reviews API Error Body:", errBody);
      throw new Error(`Failed to fetch reviews: ${reviewsRes.statusText}`);
    }

    const reviewsData = await reviewsRes.json();
    return { reviews: reviewsData.reviews || [] };
  } catch (error: any) {
    console.error("GMB Reviews API Error:", error.message);
    return { error: error.message };
  }
}

export async function postGMBReply(accountName: string, locationName: string, reviewId: string, replyText: string) {
  try {
    const token = await getAccessToken();
    const accountId = accountName.split('/')[1];
    const locationId = locationName.split('/')[1];
    const rId = reviewId.includes('/') ? reviewId.split('/').pop() : reviewId;

    const replyRes = await fetch(`https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews/${rId}/reply`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ comment: replyText })
    });

    if (!replyRes.ok) {
      const errBody = await replyRes.text();
      console.error("Reviews Reply API Error Body:", errBody);
      throw new Error(`Failed to post reply: ${replyRes.statusText}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("GMB Post Reply API Error:", error.message);
    return { error: error.message };
  }
}
