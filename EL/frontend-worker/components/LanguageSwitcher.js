import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useLanguage } from '../LanguageContext';
import { languages } from '../translations';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <View style={styles.container}>
      {languages.map((lang) => (
        <TouchableOpacity
          key={lang.code}
          style={[styles.btn, language === lang.code && styles.btnActive]}
          onPress={() => setLanguage(lang.code)}
        >
          <Text style={[styles.btnText, language === lang.code && styles.btnTextActive]}>
            {lang.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F0F4FF',
    borderRadius: 20,
    padding: 3,
    gap: 2,
  },
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  btnActive: {
    backgroundColor: '#1565C0',
  },
  btnText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  btnTextActive: {
    color: '#fff',
  },
}); 
