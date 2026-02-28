import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Modal, Keyboard, ScrollView } from 'react-native';

const GOOGLE_PLACES_API_KEY = 'AIzaSyBL235_VocCXGrObkwIZIz8jtOHK5Q-jbo';

const AddressAutocomplete = ({ 
  value, 
  onChangeText, 
  onSelect, 
  placeholder = 'Enter address...',
  style 
}) => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const openModal = useCallback(() => {
    setSearchText(value || '');
    setSelectedIndex(-1);
    setModalVisible(true);
  }, [value]);

  const handleChange = useCallback(async (text) => {
    setSearchText(text);
    onChangeText(text);
    setSelectedIndex(-1);
    
    if (text.length < 3) {
      setPredictions([]);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_PLACES_API_KEY}&components=country:in`
      );
      const data = await response.json();
      
      if (data.predictions) {
        setPredictions(data.predictions);
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  }, [onChangeText]);

  const handleSelect = useCallback((prediction, index) => {
    const address = prediction.description;
    onChangeText(address);
    onSelect(prediction);
    setSelectedIndex(index);
    // Delay closing to show selection
    setTimeout(() => {
      setModalVisible(false);
      setPredictions([]);
      Keyboard.dismiss();
    }, 300);
  }, [onChangeText, onSelect]);

  const handleDone = useCallback(() => {
    onChangeText(searchText);
    setModalVisible(false);
    Keyboard.dismiss();
  }, [onChangeText, searchText]);

  const handleClose = useCallback(() => {
    setModalVisible(false);
    setPredictions([]);
    setSelectedIndex(-1);
    Keyboard.dismiss();
  }, []);

  return (
    <View style={style}>
      {/* Input field that opens the modal */}
      <TouchableOpacity onPress={openModal} activeOpacity={0.8}>
        <TextInput
          style={styles.input}
          value={value}
          placeholder={placeholder}
          editable={false}
          pointerEvents="none"
        />
      </TouchableOpacity>
      
      {/* Full Modal with input and suggestions */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Enter Address</Text>
            <TouchableOpacity onPress={handleDone} style={styles.headerButton}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.modalInput}
              value={searchText}
              onChangeText={handleChange}
              placeholder="Search for address..."
              autoFocus
              multiline
            />
            {loading && (
              <ActivityIndicator 
                style={styles.loader} 
                size="small" 
                color="#4CAF50" 
              />
            )}
          </View>
          
          {predictions.length > 0 && (
            <ScrollView style={styles.predictionsList}>
              {predictions.map((prediction, index) => (
                <TouchableOpacity
                  key={prediction.place_id}
                  style={[
                    styles.predictionItem,
                    selectedIndex === index && styles.predictionItemSelected
                  ]}
                  onPress={() => handleSelect(prediction, index)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.predictionText,
                    selectedIndex === index && styles.predictionTextSelected
                  ]} numberOfLines={2}>
                    {prediction.description}
                  </Text>
                  {selectedIndex === index && (
                    <Text style={styles.selectedCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          
          {searchText.length >= 3 && !loading && predictions.length === 0 && (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No addresses found</Text>
            </View>
          )}
          
          {searchText.length < 3 && !loading && (
            <View style={styles.hint}>
              <Text style={styles.hintText}>Type at least 3 characters to search</Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f8f8',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
  doneText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    maxHeight: 100,
  },
  loader: {
    marginLeft: 10,
  },
  predictionsList: {
    flex: 1,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  predictionItemSelected: {
    backgroundColor: '#4CAF50',
  },
  predictionText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  predictionTextSelected: {
    color: '#fff',
  },
  selectedCheckmark: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  noResults: {
    padding: 30,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#999',
  },
  hint: {
    padding: 30,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 14,
    color: '#999',
  },
});

export default AddressAutocomplete;
