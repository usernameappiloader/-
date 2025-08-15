# Guide d'utilisation - Catégories et Aide

## Problèmes résolus

### 1. Upload de catégories
- ✅ **Support d'images pour les catégories** : Possibilité d'ajouter des images aux catégories
- ✅ **Validation améliorée** : Vérification des noms en double et format des icônes
- ✅ **Aperçu d'image** : Visualisation avant upload
- ✅ **Limites de taille** : Images jusqu'à 2MB maximum

### 2. Système d'aide
- ✅ **Aide contextuelle** : Boutons d'aide dans chaque section
- ✅ **Raccourcis clavier** : F1 ou Ctrl+H pour l'aide
- ✅ **Guides détaillés** : Instructions pour chaque fonctionnalité
- ✅ **Contact support** : Informations de contact intégrées

## Comment utiliser

### Ajouter une catégorie avec image
1. Allez dans la section "Catégories"
2. Cliquez sur "Ajouter une catégorie"
3. Remplissez le formulaire
4. Téléchargez une image (optionnel)
5. Cliquez sur "Ajouter"

### Utiliser l'aide
- **Bouton d'aide** : Cliquez sur l'icône ❓ dans chaque section
- **Raccourcis** : Appuyez sur F1 ou Ctrl+H
- **Navigation** : Utilisez la barre latérale pour accéder aux différentes sections d'aide

### Validation des catégories
- **Nom** : 2-50 caractères, lettres/chiffres/espaces uniquement
- **Icône** : Format Font Awesome requis (ex: fas fa-folder)
- **Image** : JPG, PNG, GIF jusqu'à 2MB

## Scripts ajoutés
- `js/category-upload-fix.js` : Gestion améliorée des catégories
- `js/help-system.js` : Système d'aide complet
- `js/category-validator.js` : Validation des données

## Dépannage

### Problème : Impossible d'ajouter une catégorie
1. Vérifiez que vous êtes connecté en tant qu'admin
2. Vérifiez le nom (pas de caractères spéciaux)
3. Vérifiez que le nom n'existe pas déjà
4. Vérifiez la taille de l'image (< 2MB)

### Problème : Image ne s'upload pas
1. Vérifiez le format (JPG, PNG, GIF uniquement)
2. Vérifiez la taille (< 2MB)
3. Vérifiez votre connexion internet
4. Vérifiez les permissions Firebase Storage

### Contact support
- Email : support@mr-dev-tech.com
- Réponse : 24-48h
- Incluez : captures d'écran + description détaillée
