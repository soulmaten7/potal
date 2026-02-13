import { NextResponse } from 'next/server';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '862297c953msh18d0e20a472b36bp1e3751jsn9810b160cdbe';
const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';
const AMAZON_TAG = 'soulmaten7-20'; // 사장님 수익화 태그

export interface RapidProduct {
  product_title: string;
  product_price: string;
  product_photo: string;
  product_url: string;
  asin?: string;
  delivery?: string;
  is_prime?: boolean;
  rating?: number;
  review_count?: number;
  original_price?: string;
}

export async function searchAmazon(query: string, page = 1): Promise<RapidProduct[]> {
  const url = `https://${RAPIDAPI_HOST}/search?query=${encodeURIComponent(query)}&page=${page}&country=US&sort_by=RELEVANCE`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST
      }
    });

    if (!response.ok) {
        console.error(`Amazon API Error: ${response.status}`);
        return [];
    }
    
    const data = await response.json();
    const products = data.data?.products || [];

    return products.map((p: any) => {
      // 수익화 로직: URL에 태그 자동 삽입
      let affiliateUrl = p.product_url;
      if (affiliateUrl && !affiliateUrl.includes('tag=')) {
        const separator = affiliateUrl.includes('?') ? '&' : '?';
        affiliateUrl = `${affiliateUrl}${separator}tag=${AMAZON_TAG}`;
      }

      return {
        product_title: p.product_title,
        product_price: p.product_price,
        product_photo: p.product_photo,
        product_url: affiliateUrl,
        asin: p.asin,
        delivery: p.delivery,
        is_prime: p.is_prime,
        rating: p.product_star_rating,
        review_count: p.product_num_ratings,
        original_price: p.product_original_price
      };
    });
  } catch (error) {
    console.error('Amazon Search Failed:', error);
    return [];
  }
}