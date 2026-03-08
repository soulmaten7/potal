<?php
/**
 * POTAL Landed Cost — Widget Block
 */

namespace Potal\LandedCost\Block;

use Magento\Catalog\Block\Product\AbstractProduct;
use Magento\Catalog\Block\Product\Context;
use Potal\LandedCost\Helper\Data as PotalHelper;

class Widget extends AbstractProduct
{
    protected PotalHelper $potalHelper;

    public function __construct(
        Context $context,
        PotalHelper $potalHelper,
        array $data = []
    ) {
        $this->potalHelper = $potalHelper;
        parent::__construct($context, $data);
    }

    public function isEnabled(): bool
    {
        return $this->potalHelper->isEnabled();
    }

    public function getSellerId(): string
    {
        return $this->potalHelper->getSellerId();
    }

    public function getOriginCountry(): string
    {
        return $this->potalHelper->getOriginCountry();
    }

    public function getWidgetScriptUrl(): string
    {
        return 'https://www.potal.app/widget/potal-widget.js';
    }

    public function getProductName(): string
    {
        $product = $this->getProduct();
        return $product ? $product->getName() : '';
    }

    public function getProductPrice(): float
    {
        $product = $this->getProduct();
        return $product ? (float) $product->getFinalPrice() : 0;
    }
}
