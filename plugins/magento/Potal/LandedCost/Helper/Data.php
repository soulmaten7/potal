<?php
/**
 * POTAL Landed Cost — Helper
 *
 * Central helper for all POTAL API interactions.
 * Handles: config access, API calls, caching, error logging.
 */

namespace Potal\LandedCost\Helper;

use Magento\Framework\App\Helper\AbstractHelper;
use Magento\Framework\App\Helper\Context;
use Magento\Framework\App\CacheInterface;
use Magento\Store\Model\ScopeInterface;
use Psr\Log\LoggerInterface;

class Data extends AbstractHelper
{
    const XML_PATH_ENABLED = 'potal/general/enabled';
    const XML_PATH_API_KEY = 'potal/general/api_key';
    const XML_PATH_SELLER_ID = 'potal/general/seller_id';
    const XML_PATH_ORIGIN = 'potal/general/origin_country';
    const XML_PATH_DDP = 'potal/general/enable_ddp';
    const XML_PATH_API_URL = 'potal/general/api_url';
    const DEFAULT_API_BASE = 'https://www.potal.app/api/v1';
    const CACHE_TAG = 'potal_cache';
    const CACHE_LIFETIME = 3600; // 1 hour

    private CacheInterface $cache;
    private LoggerInterface $potalLogger;

    public function __construct(
        Context $context,
        CacheInterface $cache
    ) {
        parent::__construct($context);
        $this->cache = $cache;
        $this->potalLogger = $context->getLogger();
    }

    public function isEnabled(): bool
    {
        return (bool) $this->scopeConfig->getValue(
            self::XML_PATH_ENABLED,
            ScopeInterface::SCOPE_WEBSITE
        );
    }

    public function getApiKey(): string
    {
        return (string) $this->scopeConfig->getValue(
            self::XML_PATH_API_KEY,
            ScopeInterface::SCOPE_WEBSITE
        );
    }

    public function getSellerId(): string
    {
        return (string) $this->scopeConfig->getValue(
            self::XML_PATH_SELLER_ID,
            ScopeInterface::SCOPE_WEBSITE
        );
    }

    public function getOriginCountry(): string
    {
        return (string) $this->scopeConfig->getValue(
            self::XML_PATH_ORIGIN,
            ScopeInterface::SCOPE_WEBSITE
        ) ?: 'US';
    }

    public function isDdpEnabled(): bool
    {
        return (bool) $this->scopeConfig->getValue(
            self::XML_PATH_DDP,
            ScopeInterface::SCOPE_WEBSITE
        );
    }

    /**
     * Get POTAL API base URL (configurable, defaults to production)
     */
    public function getBaseUrl(): string
    {
        $url = $this->scopeConfig->getValue(
            self::XML_PATH_API_URL,
            ScopeInterface::SCOPE_WEBSITE
        );
        return $url ?: self::DEFAULT_API_BASE;
    }

    /**
     * Call POTAL API with caching
     *
     * @param string $endpoint e.g. '/calculate'
     * @param array $data POST body
     * @return array|null API response data or null on failure
     */
    public function callApi(string $endpoint, array $data): ?array
    {
        $apiKey = $this->getApiKey();
        if (!$apiKey) {
            $this->potalLogger->warning('POTAL: API key not configured');
            return null;
        }

        // Check cache
        $cacheKey = 'potal_' . md5($endpoint . json_encode($data));
        $cached = $this->cache->load($cacheKey);
        if ($cached) {
            $decoded = json_decode($cached, true);
            if ($decoded !== null) {
                return $decoded;
            }
        }

        // API call
        $url = $this->getBaseUrl() . $endpoint;
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'X-API-Key: ' . $apiKey,
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_CONNECTTIMEOUT => 5,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($httpCode !== 200 || !$response) {
            $this->potalLogger->warning('POTAL: API call failed', [
                'url' => $url,
                'http_code' => $httpCode,
                'curl_error' => $curlError,
            ]);
            return null;
        }

        $result = json_decode($response, true);
        if (!$result || empty($result['success'])) {
            $this->potalLogger->warning('POTAL: API returned error', [
                'url' => $url,
                'response' => substr($response, 0, 500),
            ]);
            return null;
        }

        $resultData = $result['data'] ?? null;

        // Cache successful result
        if ($resultData) {
            $this->cache->save(
                json_encode($resultData),
                $cacheKey,
                [self::CACHE_TAG],
                self::CACHE_LIFETIME
            );
        }

        return $resultData;
    }
}
