import { defineEventHandler, readBody, createError } from 'h3'
import { getUserFromEvent } from '../utils/auth'

export default defineEventHandler(async (event) => {
  // 1. Authenticate user
  const user = getUserFromEvent(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  // 2. Read request body
  const body = await readBody(event)
  const { image, lang } = body || {}

  if (!image) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Image is required'
    })
  }

  // 3. Check Gemini API Key
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set in .env')
    throw createError({
      statusCode: 500,
      statusMessage: 'Gemini API Key is not configured. Please set GEMINI_API_KEY in your .env file.'
    })
  }

  // 4. Parse base64 and mime type
  let mimeType = 'image/jpeg'
  let base64Data = image

  if (image.startsWith('data:')) {
    const parts = image.split(';base64,')
    if (parts.length === 2) {
      mimeType = parts[0].replace('data:', '')
      base64Data = parts[1]
    }
  }

  // Current date for default fallback
  const currentDate = new Date().toISOString().substring(0, 10)

  const isEn = lang === 'en'

  // 5. Call Gemini API
  try {
    const model = 'gemini-3.1-flash-lite' // Standard robust model for multimodal/OCR tasks
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const prompt = `
      You are a receipt and bill parsing assistant for CekaCeka, a smart bill splitter app.
      Your task is to analyze the uploaded receipt, bill, or invoice image and extract all relevant billing details.

      CRITICAL VERIFICATION STEPS:
      1. Determine if the image is actually a receipt, bill, invoice, or billing statement.
      2. Check if the image is clear and legible enough to read prices, quantities, and item names.
      3. If it is NOT a receipt, bill, or invoice, or if it is too blurry/dark/unreadable, you must set "isBill" to false and provide a concise, clear explanation in the "reason" field (MAXIMUM 10-12 words).
         - If the requested output language is English, write it in English (e.g. "Image is not a receipt or unclear. Please retake.").
         - If the requested output language is Indonesian, write it in Indonesian (e.g. "Gambar bukan struk belanja atau kurang jelas. Silakan foto ulang.").
         The requested output language for the "reason" explanation is: ${isEn ? 'English' : 'Indonesian'}.
      4. If it IS a valid and legible bill, set "isBill" to true, and extract all fields precisely.

      EXTRACTION RULES:
      - title: Extract the store/merchant/restaurant name (e.g., "Seafood Ayu Menteng", "Starbucks"). If not found or unclear, make a best guess.
      - date: Extract the transaction date in YYYY-MM-DD format. If no date is found, use "${currentDate}".
      - category: Categorize based on merchant:
        * 'pizza': for dining, food court, restaurants, junk food, bakeries.
        * 'coffee': for cafes, coffee shops, tea stalls, dessert shops.
        * 'file': for general retail, supermarkets, online shopping, groceries, convenience stores, or others.
      - items: Extract EVERY SINGLE row of bought products/services. Do not skip any item!
        * name: item name as printed.
        * price: unit price as a number (e.g., 15000). Avoid currency symbols or thousands separators.
        * quantity: quantity of this item. If not printed or unclear, default to 1.
        * totalPrice: total price for this row (price * quantity). Double check the math.
      - taxType: 'percent' if tax is explicitly listed as a percentage (like "PB1 10%" or "PPN 11%" or "Tax 10%"). Otherwise, use 'manual'.
      - taxPercent: if tax is percentage-based, extract the percentage number (e.g., 10 for 10% tax). Use 0 if not present or if taxType is 'manual'.
      - taxManual: if tax is a fixed currency amount, extract the absolute value (e.g., 15000). Use 0 if not present or if taxType is 'percent'.
      - discountType: 'percent' if discount is listed as a percentage. Otherwise, use 'manual'.
      - discountPercent: if discount is listed as a percentage, extract the percentage number (e.g. 5 for 5% discount). Use 0 if not present or if discountType is 'manual'.
      - discountManual: if discount is a fixed money amount, extract the absolute value of the discount (e.g. 20000). Use 0 if not present or if discountType is 'percent'.
      - otherFees: Extract all extra charges or fees that are NOT the subtotal, tax, or discount. Examples: "Service Charge", "Delivery Fee", "Ongkir", "Plastic Bag", "Rounding / Pembulatan".
        * name: name of the fee/charge as printed.
        * amount: cost as a number.
    `

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              isBill: {
                type: 'BOOLEAN',
                description: 'True if the image is a legible receipt/bill/invoice, false otherwise.'
              },
              reason: {
                type: 'STRING',
                description: `If isBill is false, provide a concise explanation in the requested language (max 10-12 words, e.g. ${
                  isEn 
                    ? '"Image is not a receipt or unclear. Please retake."' 
                    : '"Gambar bukan struk belanja atau kurang jelas. Silakan foto ulang."'
                }).`
              },
              confidence: {
                type: 'NUMBER',
                description: 'Confidence rating from 0.0 to 1.0.'
              },
              title: {
                type: 'STRING',
                description: 'Name of the merchant/restaurant.'
              },
              date: {
                type: 'STRING',
                description: 'Transaction date in YYYY-MM-DD format.'
              },
              category: {
                type: 'STRING',
                enum: ['file', 'pizza', 'coffee'],
                description: 'Categorization: pizza for dining, coffee for cafes, file for general.'
              },
              items: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    name: { type: 'STRING' },
                    price: { type: 'NUMBER' },
                    quantity: { type: 'NUMBER' },
                    totalPrice: { type: 'NUMBER' }
                  },
                  required: ['name', 'price', 'quantity', 'totalPrice']
                }
              },
              taxType: {
                type: 'STRING',
                enum: ['percent', 'manual']
              },
              taxPercent: { type: 'NUMBER' },
              taxManual: { type: 'NUMBER' },
              discountType: {
                type: 'STRING',
                enum: ['percent', 'manual']
              },
              discountPercent: { type: 'NUMBER' },
              discountManual: { type: 'NUMBER' },
              otherFees: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    name: { type: 'STRING' },
                    amount: { type: 'NUMBER' }
                  },
                  required: ['name', 'amount']
                }
              }
            },
            required: [
              'isBill',
              'reason',
              'confidence',
              'title',
              'date',
              'category',
              'items',
              'taxType',
              'taxPercent',
              'taxManual',
              'discountType',
              'discountPercent',
              'discountManual',
              'otherFees'
            ]
          }
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API call failed:', errorText)
      throw createError({
        statusCode: response.status,
        statusMessage: `Gemini API returned an error: ${response.statusText || errorText}`
      })
    }

    const data = await response.json()
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!resultText) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Invalid response structure from Gemini API'
      })
    }

    const parsedResult = JSON.parse(resultText)
    return {
      success: true,
      data: parsedResult
    }
  } catch (error: any) {
    console.error('Error scanning bill with Gemini:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to scan bill. Please try again.'
    })
  }
})
