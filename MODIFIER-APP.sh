#!/bin/bash
# ═══════════════════════════════════════════════
#  75 JOURS — Modifier l'application
# ═══════════════════════════════════════════════
#
#  1. Ouvre le Terminal
#  2. Tape cette commande et appuie Entrée :
#
#     ~/75-jours/MODIFIER-APP.sh
#
#  3. Claude va s'ouvrir, dis-lui ce que tu veux
#     modifier et il s'occupe de tout.
#
# ═══════════════════════════════════════════════

cd ~/75-jours

echo ""
echo "══════════════════════════════════════"
echo "  75 JOURS — Préparation en cours..."
echo "══════════════════════════════════════"
echo ""

# Installer les dépendances si besoin
if [ ! -d "node_modules" ]; then
  echo "→ Installation des dépendances..."
  eval "$(/opt/homebrew/bin/brew shellenv)"
  npm install --silent
  echo "→ OK !"
  echo ""
fi

echo "→ Tout est prêt."
echo ""
echo "══════════════════════════════════════"
echo "  Lance maintenant Claude Code :"
echo ""
echo "  claude"
echo ""
echo "  Puis dis-lui ce que tu veux changer."
echo "  Ex: \"change la couleur de l'accent\""
echo "  Ex: \"ajoute un tracker de sommeil\""
echo "══════════════════════════════════════"
echo ""



Ce que claude m'a dit pour modifier l'app la prochaine fois:


C'est fait. La prochaine fois que tu veux modifier l'app :                    
                                                                                
  1. Ouvre le Terminal                                                          
  2. Tape : ~/75-jours/MODIFIER-APP.sh                                          
  3. Puis tape : claude                                                         
  4. Dis-moi ce que tu veux changer — je retrouverai tout le contexte           
  automatiquement 
