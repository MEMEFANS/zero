import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ethers } from 'ethers';
import Button from '../shared/Button';
import { NFT_RARITY } from '../../constants/contracts';

const NFTDetails = ({ 
  nft, 
  onClose,
  onList,
  onUnlist,
  onBuy,
  onStake,
  isOwner,
  loading = false
}) => {
  const [listPrice, setListPrice] = useState('');
  const [showListForm, setShowListForm] = useState(false);

  const handleList = (e) => {
    e.preventDefault();
    if (!listPrice) return;
    onList(nft.tokenId, parseFloat(listPrice));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1e2839] rounded-xl max-w-2xl w-full mx-4 overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold">NFT #{nft.tokenId}</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <img 
                src={nft.image || '/images/nft-placeholder.png'} 
                alt={`NFT #${nft.tokenId}`}
                className="w-full rounded-lg"
              />
            </div>

            <div>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400">稀有度</p>
                  <p className="text-xl font-bold">{NFT_RARITY[nft.attributes.rarity]}</p>
                </div>

                <div>
                  <p className="text-gray-400">算力</p>
                  <p className="text-xl font-bold">{nft.attributes.power}</p>
                </div>

                <div>
                  <p className="text-gray-400">日收益</p>
                  <p className="text-xl font-bold">{nft.attributes.dailyReward} ZONE</p>
                </div>

                <div>
                  <p className="text-gray-400">已挖取</p>
                  <p className="text-xl font-bold">{nft.attributes.minedAmount} ZONE</p>
                </div>

                {nft.price && (
                  <div>
                    <p className="text-gray-400">价格</p>
                    <p className="text-xl font-bold">
                      {ethers.BigNumber.isBigNumber(nft.price) 
                        ? ethers.utils.formatEther(nft.price) 
                        : nft.price} BNB
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-4">
                {isOwner ? (
                  <>
                    {nft.isListed ? (
                      <Button
                        onClick={() => onUnlist(nft.tokenId)}
                        disabled={loading}
                        variant="danger"
                        className="w-full"
                      >
                        取消出售
                      </Button>
                    ) : (
                      <>
                        {showListForm ? (
                          <form onSubmit={handleList} className="space-y-4">
                            <input
                              type="number"
                              step="0.001"
                              value={listPrice}
                              onChange={(e) => setListPrice(e.target.value)}
                              placeholder="输入价格 (BNB)"
                              className="w-full px-4 py-2 bg-[#1a2233] border border-gray-700 rounded-lg"
                              disabled={loading}
                            />
                            <Button
                              type="submit"
                              disabled={loading || !listPrice}
                              className="w-full"
                            >
                              确认上架
                            </Button>
                          </form>
                        ) : (
                          <Button
                            onClick={() => setShowListForm(true)}
                            disabled={loading}
                            className="w-full"
                          >
                            上架出售
                          </Button>
                        )}
                      </>
                    )}
                    
                    {!nft.attributes.isStaked && (
                      <Button
                        onClick={() => onStake(nft.tokenId)}
                        disabled={loading}
                        variant="secondary"
                        className="w-full"
                      >
                        质押挖矿
                      </Button>
                    )}
                  </>
                ) : (
                  <Button
                    onClick={() => onBuy(nft.tokenId, nft.price)}
                    disabled={loading || !nft.isListed}
                    className="w-full"
                  >
                    购买
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

NFTDetails.propTypes = {
  nft: PropTypes.shape({
    tokenId: PropTypes.number.isRequired,
    image: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isListed: PropTypes.bool,
    attributes: PropTypes.shape({
      rarity: PropTypes.number.isRequired,
      power: PropTypes.number.isRequired,
      dailyReward: PropTypes.number.isRequired,
      minedAmount: PropTypes.number.isRequired,
      isStaked: PropTypes.bool.isRequired
    }).isRequired
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onList: PropTypes.func.isRequired,
  onUnlist: PropTypes.func.isRequired,
  onBuy: PropTypes.func.isRequired,
  onStake: PropTypes.func.isRequired,
  isOwner: PropTypes.bool.isRequired,
  loading: PropTypes.bool
};

export default React.memo(NFTDetails);
