import React, { useState } from 'react';
import priceData from '../price.json';
import './app.css';

interface MenuItem {
  name: string;
  price: number;
}

interface Category {
  name: string;
  items: MenuItem[];
}

interface PriceData {
  category: Category[];
  allItems?: MenuItem[]; // 用于"全部"分类
}

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  subtotal: string;
}

const MenuCalculator = () => {
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 准备全部分类数据
  const allItems = (priceData as PriceData).category.flatMap(category => category.items);
  (priceData as PriceData).allItems = allItems;

  const getCurrentItems = () => {
    if (selectedCategory === 'all') {
      return allItems;
    }
    return (priceData as PriceData).category[selectedCategory].items;
  };

  const getFilteredItems = () => {
    const items = getCurrentItems();
    if (!searchQuery) return items;
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const calculateTotal = () => {
    let newTotal = 0;
    allItems.forEach((item: MenuItem) => {
      newTotal += (quantities[item.name] || 0) * item.price;
    });
    setTotal(parseFloat(newTotal.toFixed(2)));
  };

  React.useEffect(() => {
    calculateTotal();
  }, [quantities]);

  const handleQuantityChange = (itemName: string, value: number) => {
    const newValue = Math.max(0, value);
    setQuantities(prev => ({
      ...prev,
      [itemName]: newValue
    }));
  };

  const getOrderDetails = (): OrderItem[] => {
    return allItems
      .filter((item: MenuItem) => quantities[item.name] > 0)
      .map((item: MenuItem) => ({
        name: item.name,
        price: item.price,
        quantity: quantities[item.name],
        subtotal: (quantities[item.name] * item.price).toFixed(2)
      }));
  };

  return (
    <div className="calculator-container">
      <h1>菜单价格计算器</h1>
      
      <div className="search-box">
        <input
          type="text"
          placeholder="搜索菜品..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="category-selector">
        <button
          key="all"
          className={selectedCategory === 'all' ? 'active' : ''}
          onClick={() => setSelectedCategory('all')}
        >
          全部
        </button>
        {(priceData as PriceData).category.map((category: Category, index: number) => (
          <button
            key={category.name}
            className={selectedCategory === index ? 'active' : ''}
            onClick={() => setSelectedCategory(index)}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="menu-items">
        {getFilteredItems().map((item: MenuItem) => (
          <div key={item.name} className="menu-item">
            <span className="item-name">{item.name}</span>
            <span className="item-price">¥{item.price.toFixed(2)}</span>
            <div className="quantity-control">
              <button onClick={() => handleQuantityChange(item.name, (quantities[item.name] || 0) - 1)}>-</button>
              <input
                type="number"
                min="0"
                value={quantities[item.name] || 0}
                onChange={(e) => handleQuantityChange(item.name, parseInt(e.target.value) || 0)}
              />
              <button onClick={() => handleQuantityChange(item.name, (quantities[item.name] || 0) + 1)}>+</button>
            </div>
          </div>
        ))}
      </div>

      <div className="total-section">
        <h2>总价: ¥{total.toFixed(2)}</h2>
        <div className="action-buttons">
          <button 
            className="details-btn"
            onClick={() => setShowOrderDetails(true)}
            disabled={total === 0}
          >
            查看订单详情
          </button>
          <button 
            className="clear-btn"
            onClick={() => {
              setQuantities({});
              setTotal(0);
            }}
          >
            清空
          </button>
        </div>
      </div>

      {showOrderDetails && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>订单详情</h3>
            <table>
              <thead>
                <tr>
                  <th>菜品</th>
                  <th>单价</th>
                  <th>数量</th>
                  <th>小计</th>
                </tr>
              </thead>
              <tbody>
                {getOrderDetails().map((item: OrderItem) => (
                  <tr key={item.name}>
                    <td>{item.name}</td>
                    <td>¥{item.price.toFixed(2)}</td>
                    <td>{item.quantity}</td>
                    <td>¥{item.subtotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="modal-actions">
              <button onClick={() => setShowOrderDetails(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuCalculator;
