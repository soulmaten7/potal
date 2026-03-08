<?php
/**
 * POTAL Landed Cost — Helper
 */

namespace Potal\LandedCost\Helper;

use Magento\Framework\App\Helper\AbstractHelper;
use Magento\Store\Model\ScopeInterface;

class Data extends AbstractHelper
{
    const XML_PATH_ENABLED = 'potal/general/enabled';
    const XML_PATH_API_KEY = 'potal/general/api_key';
    const XML_PATH_SELLER_ID = 'potal/general/seller_id';
    const XML_PATH_ORIGIN = 'potal/general/origin_country';
    const XML_PATH_DDP = 'potal/general/enable_ddp';
    const API_BASE = 'https://www.potal.app/api/v1';

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
     * Call POTAL API
     */
    public function callApi(string $endpoint, array $data): ?array
    {
        $apiKey = $this->getApiKey();
        if (!$apiKey) return null;

        $ch = curl_init(self::API_BASE . $endpoint);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'X-API-Key: ' . $apiKey,
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || !$response) return null;

        $result = json_decode($response, true);
        return ($result && $result['success']) ? $result['data'] : null;
    }
}
