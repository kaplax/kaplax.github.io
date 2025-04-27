import React, { useState, useEffect, useRef } from 'react';
import './MenuPage.css'; // Import the CSS file
// import { WebSocket } from "ws";

interface MenuItem {
  name: string;
  id: string;
  image: string;
  type: string;
}

interface MenuData {
  menus: MenuItem[];
}

interface WSEventData {
  type: "menu" | "selectedMenu";
  data: MenuData;
}

const apiPath = 'wss://139.224.71.200'; // process.env.API_PATH || 'http://localhost';
const wsPort = "80";
const apiPort = "80"

const MenusPage = () => {
  const [menuData, setMenuData] = useState<MenuItem[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | 'all'>('all'); // State for active category
  const [showSelectedMenu, setShowSelectedMenu] = useState(false); // State for selected menu visibility
  const [showCustomItemModal, setShowCustomItemModal] = useState(false); // State for custom item modal visibility
  const [customItemName, setCustomItemName] = useState(''); // State for custom item name input
  const [showMessageModal, setShowMessageModal] = useState(false); // State for message modal visibility
  const [messageContent, setMessageContent] = useState(''); // State for message modal content
  const [buttonPosition, setButtonPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 80 }); // State for button position
  const [isDragging, setIsDragging] = useState(false); // State to track dragging
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); // State to track drag offset
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef<boolean>(false);
  
  // WebSocket connection function
  const connectWebSocket = () => {
    // Prevent multiple connection attempts
    if (isConnectingRef.current) {
      console.log('Connection already in progress, skipping');
      return;
    }
    
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connected or connecting, skipping');
      return;
    }
    
    isConnectingRef.current = true;
    console.log('Connecting to WebSocket...');
    
    wsRef.current = new WebSocket(`${apiPath}`);
    
    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
      setLoading(false);
      setError(null);
      isConnectingRef.current = false;
    };

    wsRef.current.onmessage = (event) => {
      try {
        console.log('event.data', event.data);
        const data: WSEventData = JSON.parse(event.data);
        if (data.type === "menu") {
          setMenuData(data.data.menus);
        } else if (data.type === "selectedMenu") {
          setSelectedMenu(data.data.menus);
        }
        setLoading(false);
      } catch (err) {
        setError('Error parsing menu data');
        setLoading(false);
      }
    };

    wsRef.current.onerror = (err) => {
      console.error('WebSocket error', err);
      setError('WebSocket error');
      setLoading(false);
      isConnectingRef.current = false;
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket closed, attempting to reconnect...');
      isConnectingRef.current = false;
      
      // Try to reconnect after a delay
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
    };
  };

  // Initial connection - only run once on component mount
  useEffect(() => {
    // Only connect if we don't already have a connection
    connectWebSocket();

    // Handle visibility change (when tab becomes visible after being hidden)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Document became visible, checking WebSocket connection');
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          connectWebSocket();
        }
      }
    };

    // Handle online/offline events
    const handleOnline = () => {
      console.log('Network connection restored, reconnecting WebSocket');
      connectWebSocket();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    
    // Set up ping interval to keep connection alive
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Send ping every 30 seconds
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      clearInterval(pingInterval);
      
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      
      isConnectingRef.current = false;
    };
  }, []); // Empty dependency array ensures this only runs once on mount

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging) {
        setButtonPosition({
          x: event.clientX - dragOffset.x,
          y: event.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Touch events for mobile
    const handleTouchMove = (event: TouchEvent) => {
      if (isDragging && event.touches[0]) {
        setButtonPosition({
          x: event.touches[0].clientX - dragOffset.x,
          y: event.touches[0].clientY - dragOffset.y,
        });
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragOffset]);

  const handleMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
    setIsDragging(true);
    setDragOffset({
      x: event.clientX - buttonPosition.x,
      y: event.clientY - buttonPosition.y,
    });
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLButtonElement>) => {
    if (event.touches[0]) {
      setIsDragging(true);
      setDragOffset({
        x: event.touches[0].clientX - buttonPosition.x,
        y: event.touches[0].clientY - buttonPosition.y,
      });
    }
  };


  const showMessage = (message: string) => {
    setMessageContent(message);
    setShowMessageModal(true);
  };

  const hideMessage = () => {
    setMessageContent('');
    setShowMessageModal(false);
  };

  const addProductToMenu = async (item: MenuItem) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "addToMenu",
        data: item,
      }));
    } else {
      showMessage("Connection lost. Trying to reconnect...");
      connectWebSocket();
    }
  };

  const addMenuItem = async (item: MenuItem) => {
    // Check if the item is already in the selected menu
    const isItemAlreadySelected = selectedMenu.some(selectedItem => selectedItem.id === item.id);

    if (isItemAlreadySelected) {
      showMessage(`${item.name} is already in the selected menu.`);
      return; // Do not add the item again
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "addToSelectedMenu",
        data: item,
      }));
    } else {
      showMessage("Connection lost. Trying to reconnect...");
      connectWebSocket();
    }
  };

  const removeSelectedMenuItem = async (itemId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "removeFromSelectedMenu",
        data: { id: itemId },
      }));
    } else {
      showMessage("Connection lost. Trying to reconnect...");
      connectWebSocket();
    }
  };

  const removeMenuItem = async (itemId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "removeFromMenu",
        data: { id: itemId },
      }));
    } else {
      showMessage("Connection lost. Trying to reconnect...");
      connectWebSocket();
    }
  };

  const handleAddCustomItemClick = () => {
    setShowCustomItemModal(true);
  };

  const handleCustomItemSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (customItemName && activeCategory !== 'all') {
      const customItem: MenuItem = {
        name: customItemName,
        id: Date.now().toString(), // Simple unique ID
        image: '', // No image for custom items
        type: activeCategory as string,
      };
      await addProductToMenu(customItem);
      setCustomItemName('');
      setShowCustomItemModal(false);
    }
  };

  const handleCustomItemModalClose = () => {
    setCustomItemName('');
    setShowCustomItemModal(false);
  };


  if (loading) {
    return <div>Loading menu data...</div>;
  }

  if (error) {
    return <div style={{position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)"}}>正在尝试重新连接, 请稍等...</div>;
  }

  // Group menu items by type
  const categorizedMenu = menuData.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // Get unique categories
  const categories = ['all', ...Object.keys(categorizedMenu)];

  // Filter menu items based on active category
  const filteredMenu = activeCategory === 'all'
    ? menuData
    : categorizedMenu[activeCategory] || [];

  return (
    <div className="menus-container">
      <div className="category-tabs">
        {categories.map(category => (
          <button
            key={category}
            className={activeCategory === category ? 'active' : ''}
            onClick={() => setActiveCategory(category)}
          >
            {category === 'all' ? 'All' : category}
          </button>
        ))}
      </div>

      <div className="menu-items-list">
        {filteredMenu.map((item, idx) => (
          <div key={item.id + idx} className="menu-item">
            <span className="menu-item-name">{item.name}</span>
            <button style={{ marginRight: '10px' }} className="add-button" onClick={() => addMenuItem(item)}>Add</button> {/* Added individual add button back */}
            {/* <button className="remove-button" onClick={() => removeMenuItem(item.id)}>Remove</button> */}
          </div>
        ))}
        {/* Button to add custom item */}
        {activeCategory !== 'all' && ( // Only show in specific categories
          <button className="add-custom-button" onClick={handleAddCustomItemClick}>
            Add Custom Item to {activeCategory}
          </button>
        )}
      </div>

      {/* Floating button to toggle selected menu */}
      <button
        className="selected-menu-toggle-button"
        style={{ left: buttonPosition.x, top: buttonPosition.y }}
        onClick={() => setShowSelectedMenu(!showSelectedMenu)}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        Selected ({selectedMenu.length})
      </button>

      {/* Floating selected menu container (now a modal) */}
      {showSelectedMenu && (
        <div className="modal-overlay" onClick={() => setShowSelectedMenu(false)}> {/* Backdrop to close modal */}
          <div className="modal-content" onClick={(e) => e.stopPropagation()}> {/* Prevent clicks inside from closing */}
            <h2 className="selected-menu-title">Selected Menu</h2>
            <ul className="selected-menu-list">
              {selectedMenu.map((item) => (
                <li key={item.id} className="selected-menu-item">
                  <span className="selected-menu-item-name">{item.name}</span>
                  <button className="remove-button" onClick={() => removeSelectedMenuItem(item.id)}>Remove</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Custom Item Modal */}
      {showCustomItemModal && (
        <div className="modal-overlay" onClick={handleCustomItemModalClose}> {/* Backdrop to close modal */}
          <div className="modal-content" onClick={(e) => e.stopPropagation()}> {/* Prevent clicks inside from closing */}
            <h3>Add Custom Item to {activeCategory}</h3>
            <form onSubmit={handleCustomItemSubmit}>
              <div className="form-group">
                <label htmlFor="customItemName">Item Name:</label>
                <input
                  type="text"
                  id="customItemName"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit">Add Item</button>
                <button type="button" onClick={handleCustomItemModalClose}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="message-modal-overlay">
          <div className="message-modal-content">
            <p>{messageContent}</p>
            <button onClick={hideMessage}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenusPage;
