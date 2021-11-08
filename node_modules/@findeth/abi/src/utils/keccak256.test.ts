import { keccak256 } from './keccak256';

describe('keccak256', () => {
  it('returns the keccak256 hash of a string', () => {
    expect(keccak256('transfer(address,uint256)')).toBe(
      'a9059cbb2ab09eb219583f4a59a5d0623ade346d962bcd4e46b11da047c9049b'
    );
    expect(keccak256('approve(address,uint256)')).toBe(
      '095ea7b334ae44009aa867bfb386f5c3b4b443ac6f0ee573fa91c4608fbadfba'
    );
  });
});
