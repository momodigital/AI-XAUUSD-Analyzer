package com.aixauusd.analyzer.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import java.io.ByteArrayOutputStream
import java.io.InputStream
import kotlin.math.roundToInt

object BitmapUtils {

    /**
     * Converts a Bitmap into a Base64 string with JPEG compression quality 80.
     * Enforces max dimension limit of 1600px on the longest side.
     */
    fun toBase64Jpeg(bitmap: Bitmap, quality: Int = 80, maxDimension: Int = 1600): String {
        val scaledBitmap = scaleDownIfNeeded(bitmap, maxDimension)
        val outputStream = ByteArrayOutputStream()
        scaledBitmap.compress(Bitmap.CompressFormat.JPEG, quality, outputStream)
        val byteArray = outputStream.toByteArray()
        return Base64.encodeToString(byteArray, Base64.NO_WRAP)
    }

    /**
     * Scales down bitmap if width or height exceeds [maxDimension], preserving aspect ratio.
     */
    fun scaleDownIfNeeded(bitmap: Bitmap, maxDimension: Int = 1600): Bitmap {
        val width = bitmap.width
        val height = bitmap.height

        if (width <= maxDimension && height <= maxDimension) {
            return bitmap
        }

        val ratio = width.toFloat() / height.toFloat()
        val newWidth: Int
        val newHeight: Int

        if (width > height) {
            newWidth = maxDimension
            newHeight = (maxDimension / ratio).roundToInt()
        } else {
            newHeight = maxDimension
            newWidth = (maxDimension * ratio).roundToInt()
        }

        return Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
    }

    /**
     * Decodes a Uri from camera/gallery into a Bitmap safely handling sample size.
     */
    fun uriToBitmap(context: Context, uri: Uri, maxDimension: Int = 1600): Bitmap? {
        return try {
            val input: InputStream? = context.contentResolver.openInputStream(uri)
            val options = BitmapFactory.Options().apply {
                inJustDecodeBounds = true
            }
            BitmapFactory.decodeStream(input, null, options)
            input?.close()

            var sampleSize = 1
            while (options.outWidth / sampleSize > maxDimension * 2 ||
                options.outHeight / sampleSize > maxDimension * 2
            ) {
                sampleSize *= 2
            }

            val decodeOptions = BitmapFactory.Options().apply {
                inSampleSize = sampleSize
                inPreferredConfig = Bitmap.Config.ARGB_8888
            }

            val finalInput = context.contentResolver.openInputStream(uri)
            val decoded = BitmapFactory.decodeStream(finalInput, null, decodeOptions)
            finalInput?.close()

            decoded?.let { scaleDownIfNeeded(it, maxDimension) }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}
