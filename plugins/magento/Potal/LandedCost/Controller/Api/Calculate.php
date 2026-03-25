<?php
/**
 * POTAL Landed Cost — Server-side API Proxy Controller
 *
 * Proxies requests to POTAL API so the API key is never exposed to the browser.
 * Frontend JS calls /potal/api/calculate → this controller → POTAL API.
 */
namespace Potal\LandedCost\Controller\Api;

use Magento\Framework\App\Action\Action;
use Magento\Framework\App\Action\Context;
use Magento\Framework\Controller\Result\JsonFactory;
use Potal\LandedCost\Helper\Data as PotalHelper;

class Calculate extends Action
{
    private PotalHelper $potalHelper;
    private JsonFactory $jsonFactory;

    public function __construct(
        Context $context,
        PotalHelper $potalHelper,
        JsonFactory $jsonFactory
    ) {
        parent::__construct($context);
        $this->potalHelper = $potalHelper;
        $this->jsonFactory = $jsonFactory;
    }

    public function execute()
    {
        $result = $this->jsonFactory->create();

        if (!$this->potalHelper->isEnabled()) {
            return $result->setData(['success' => false, 'error' => 'POTAL is disabled']);
        }

        $body = json_decode($this->getRequest()->getContent(), true);
        if (!is_array($body) || empty($body['price'])) {
            return $result->setData(['success' => false, 'error' => 'Invalid request body']);
        }

        $apiResult = $this->potalHelper->callApi('/calculate', $body);

        if ($apiResult === null) {
            return $result->setData(['success' => false, 'error' => 'API call failed']);
        }

        return $result->setData(['success' => true, 'data' => $apiResult]);
    }
}
